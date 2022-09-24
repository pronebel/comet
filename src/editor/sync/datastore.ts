import type {
    ConvergenceDomain,
    IConvergenceEvent,
    ObjectSetEvent,
    RealTimeArray,
    RealTimeModel,
} from '@convergence/convergence';
import Convergence, { RealTimeObject } from '@convergence/convergence';
import { EventEmitter } from 'eventemitter3';

import type { ModelValue } from '../../core/model/model';
import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import type { GraphNode } from '../../core/nodes/abstract/graphNode';
import { consolidateNodeId, getGraphNode } from '../../core/nodes/nodeFactory';
import { type CloneInfoSchema, type NodeSchema, createProjectSchema } from '../../core/nodes/schema';
import { Application } from '../application';
import { CreateNodeCommand } from '../commands/createNode';
import { getUserName } from './user';

const userName = getUserName();

export const defaultProjectSettings = {
    collection: 'projects',
    overrideCollectionWorldPermissions: false,
    ephemeral: false,
    worldPermissions: { read: true, write: true, remove: true, manage: true },
};

export const connectionTimeout = 2500;

export type DatastoreEvents =
| 'nodeCreated'
| 'setParent'
| 'nodeRemoved'
| 'customPropDefined'
| 'customPropUndefined'
| 'customPropAssigned'
| 'customPropUnassigned'
| 'modelModified'
| 'cloneInfoModified';

const logStyle = 'color:cyan';

export class Datastore extends EventEmitter<DatastoreEvents>
{
    protected _domain?: ConvergenceDomain;
    protected _model?: RealTimeModel;
    public nodeRealtimeObjects: Map<string, RealTimeObject>;

    public static instance: Datastore;

    constructor()
    {
        super();

        Datastore.instance = this;

        this.nodeRealtimeObjects = new Map();
    }

    public get app()
    {
        return Application.instance;
    }

    public get domain()
    {
        if (!this._domain)
        {
            throw new Error('Domain not found');
        }

        return this._domain;
    }

    get model()
    {
        if (!this._model)
        {
            throw new Error('Datastore model not initialised');
        }

        return this._model;
    }

    get nodes()
    {
        return this.model.elementAt('nodes') as RealTimeObject;
    }

    public reset()
    {
        this.nodeRealtimeObjects.clear();
        delete this._model;
    }

    public connect(): Promise<ConvergenceDomain>
    {
        return new Promise<ConvergenceDomain>((resolve, reject) =>
        {
            const url = 'https://localhost/realtime/convergence/default';

            const timeout = setTimeout(() =>
            {
                reject(new Error(`Connection timeout`));
            }, connectionTimeout);

            Convergence.connect(url, userName, 'password', {
                connection: {
                    connectionRequestTimeout: connectionTimeout,
                    timeout: connectionTimeout,
                },
                models: {
                    data: {
                        undefinedObjectValues: 'omit',
                        undefinedArrayValues: 'null',
                    },
                },
            }).then((domain) =>
            {
                clearTimeout(timeout);
                console.log(`%cConnected as ${userName}!`, 'color:lime');
                this._domain = domain;
                resolve(domain);
            }).catch(reject);
        });
    }

    public registerNode(id: string, nodeElement: RealTimeObject)
    {
        if (this.nodeRealtimeObjects.has(id))
        {
            throw new Error(`Node "${id}" RealTimeObject already registered.`);
        }

        // store element
        this.nodeRealtimeObjects.set(id, nodeElement);

        // track remote events on node changes
        nodeElement.on(RealTimeObject.Events.SET, (event: IConvergenceEvent) =>
        {
            const key = (event as ObjectSetEvent).key;

            if (key === 'parent')
            {
                const parentId = (event as ObjectSetEvent).value.value();
                const childId = nodeElement.get('id').value();

                console.log(`%c${userName}:${id}:parent.set: ${parentId} ${childId}`, logStyle);

                this.emit('setParent', parentId, childId);
            }
        });

        // catch events on nodeElement custom prop defined changes (as a remote user)
        nodeElement.elementAt('customProperties', 'defined').on(RealTimeObject.Events.SET, (event: IConvergenceEvent) =>
        {
            const name = (event as ObjectSetEvent).key;
            const element = (event as ObjectSetEvent).value as RealTimeObject;

            const { type, value } = element.toJSON();
            const info = JSON.stringify(element.toJSON());

            console.log(`%c${userName}:${id}:customProperties.defined: ${info}`, logStyle);

            this.emit('customPropDefined', id, name, type, value);
        }).on(RealTimeObject.Events.REMOVE, (event: IConvergenceEvent) =>
        {
            const propName = (event as ObjectSetEvent).key;

            console.log(`%c${userName}:${id}:customProperties.undefined: "${propName}"`, logStyle);

            this.emit('customPropUndefined', id, propName);
        });

        // catch events on nodeElement custom prop assigned changes (as a remote user)
        nodeElement.elementAt('customProperties', 'assigned').on(RealTimeObject.Events.SET, (event: IConvergenceEvent) =>
        {
            const modelKey = (event as ObjectSetEvent).key;
            const customKey = (event as ObjectSetEvent).value.value() as string;

            console.log(`%c${userName}:${id}:customProperties.assign: "${modelKey}->${customKey}"`, logStyle);

            this.emit('customPropAssigned', id, modelKey, customKey);
        }).on(RealTimeObject.Events.REMOVE, (event: IConvergenceEvent) =>
        {
            const modelKey = (event as ObjectSetEvent).key;

            console.log(`%c${userName}:${id}:customProperties.unassigned: "${modelKey}"`, logStyle);

            this.emit('customPropUnassigned', id, modelKey);
        });

        // catch events from model
        nodeElement.elementAt('model').on(RealTimeObject.Events.SET, (event: IConvergenceEvent) =>
        {
            const key = (event as ObjectSetEvent).key;
            const value = (event as ObjectSetEvent).value.value() as ModelValue;

            console.log(`%c${userName}:${id}:model.set: ${key}->${value}`, logStyle);

            this.emit('modelModified', id, key, value);
        }).on(RealTimeObject.Events.VALUE, (event: IConvergenceEvent) =>
        {
            const model = (event as ObjectSetEvent).element.value();

            console.log(`%c${userName}:${id}:model.value: ${JSON.stringify(model)}`, logStyle);

            this.emit('modelModified', id, undefined, model);
        }); // todo: REMOVE?

        // catch events from cloneInfo
        nodeElement.elementAt('cloneInfo').on(RealTimeObject.Events.VALUE, (event: IConvergenceEvent) =>
        {
            const cloneInfo = (event as ObjectSetEvent).element.value();

            console.log(`%c${userName}:${id}:cloneInfo.set: ${JSON.stringify(cloneInfo)}`, logStyle);

            this.emit('cloneInfoModified', id, cloneInfo);
        });

        console.log(`${userName}:Registered RealTimeObject "${id}"`);
    }

    public createNodeSchema(nodeSchema: NodeSchema)
    {
        const nodeElement = this.nodes.set(nodeSchema.id, nodeSchema) as RealTimeObject;

        this.registerNode(nodeSchema.id, nodeElement);
    }

    public setNodeParent(childId: string, parentId: string)
    {
        const parentElement = this.getNodeElement(parentId);
        const childElement = this.getNodeElement(childId);

        // set parent data
        childElement.set('parent', parentId);

        // set children data
        const childArray = parentElement.get('children') as RealTimeArray;

        // const index = childArray.findIndex((id) => id.value() === childId);

        childArray.push(childId);
    }

    public updateNodeCloneInfo(nodeId: string, cloneInfoSchema: CloneInfoSchema)
    {
        const nodeElement = this.getNodeElement(nodeId);

        nodeElement.get('cloneInfo').value(cloneInfoSchema);
    }

    public modifyNodeModel(nodeId: string, values: object)
    {
        const nodeElement = this.getNodeElement(nodeId);
        const modelElement = nodeElement.get('model') as RealTimeObject;

        this.batch(() =>
        {
            for (const [k, v] of Object.entries(values))
            {
                modelElement.set(k, v);
            }
        });
    }

    public removeNode(nodeId: string, parentId: string)
    {
        const parentElement = this.getNodeElement(parentId);

        // remove from nodes RealTimeObject
        this.nodes.remove(nodeId);

        // remove child reference in parent element
        const childArray = parentElement.get('children') as RealTimeArray;
        const index = childArray.findIndex((id) => id.value() === nodeId);

        if (index === -1)
        {
            throw new Error(`Could not find child "${nodeId}" reference in parent "${parentId}"`);
        }

        childArray.remove(index);

        // unregister RealTimeObject for node
        this.unRegisterNode(nodeId);
    }

    public async createProject(name: string, id?: string)
    {
        const data = createProjectSchema(name);

        const model = await this.domain.models().openAutoCreate({
            ...defaultProjectSettings,
            id,
            data,
        });

        console.log(`%c${userName}:Created project "${model.modelId()}"`, logStyle);

        return await this.openProject(model.modelId());
    }

    public async openProject(id: string): Promise<ClonableNode>
    {
        const model = await this.domain.models().open(id);

        console.log(`%c${userName}:Opened project "${model.modelId()}"`, logStyle);

        this._model = model;

        await this.joinActivity('editProject', model.modelId());

        // catch events when a remote user adds or removes a node...
        this.nodes.on(RealTimeObject.Events.SET, (event: IConvergenceEvent) =>
        {
            const nodeElement = (event as ObjectSetEvent).value as RealTimeObject;
            const nodeId = nodeElement.get('id').value() as string;
            const parentId = nodeElement.get('parent').value() as string | undefined;

            consolidateNodeId(nodeId);

            console.log(`%c${userName}:nodes.set: ${JSON.stringify(nodeElement.toJSON())}`, logStyle);

            this.registerNode(nodeId, nodeElement);

            this.emit('nodeCreated', nodeElement);

            if (parentId)
            {
                const childId = nodeElement.get('id').value() as string;

                this.emit('setParent', parentId, childId);
            }
        }).on(RealTimeObject.Events.REMOVE, (event: IConvergenceEvent) =>
        {
            const nodeId = (event as ObjectSetEvent).key;

            const nodeElement = (event as ObjectSetEvent).oldValue as RealTimeObject;
            const parentId = nodeElement.get('parent').value() as string | undefined;

            console.log(`%c${userName}:nodes.remove: ${nodeId}`, logStyle);

            if (parentId)
            {
                this.emit('nodeRemoved', nodeId, parentId);
            }
        });

        return this.hydrate();
    }

    public hydrate()
    {
        const { nodes } = this;

        const nodeElements: Map<string, RealTimeObject> = new Map();

        // prepare all nodeElements

        nodes.keys().forEach((id) =>
        {
            const nodeElement = nodes.get(id) as RealTimeObject;

            nodeElements.set(id, nodeElement);
        });

        // get the root
        const rootId = this.model.root().get('root').value() as string;
        const projectNode = nodeElements.get(rootId);

        const hydrate = (nodeElement: RealTimeObject, parentNode?: ClonableNode) =>
        {
            const id = nodeElement.get('id').value() as string;

            // ensure local ids don't clash with hydrating ids
            consolidateNodeId(id);

            // create the graph node
            const nodeSchema = nodeElement.toJSON() as NodeSchema<{}>;

            const { node } = new CreateNodeCommand({ nodeSchema }).exec();

            // add to parent if provided
            if (parentNode)
            {
                parentNode.addChild(node as GraphNode);
            }

            // recursively create children
            (nodeElement.get('children').value() as RealTimeArray).forEach((id) =>
            {
                const childId = String(id);
                const childNodeElement = nodeElements.get(childId);

                if (childNodeElement)
                {
                    hydrate(childNodeElement, node);
                }
                else
                {
                    throw new Error(`Could not find childElement "${childId}"`);
                }
            });
        };

        if (projectNode)
        {
            // start from the root node (Project)

            hydrate(projectNode);
        }
        else
        {
            throw new Error('Could not find project node');
        }

        const rootNode = getGraphNode(rootId);

        return rootNode;
    }

    public disconnect(): void
    {
        if (!this.domain.isDisposed())
        {
            this.domain.dispose();
            console.log('%c${userName}:Domain disposed', logStyle);
        }
    }

    public batch(fn: () => void)
    {
        this.model.startBatch();
        fn();
        this.model.completeBatch();
    }

    protected async joinActivity(type: string, id: string)
    {
        await this.domain.activities().join(type, id, {
            autoCreate: {
                ephemeral: true,
                worldPermissions: ['join', 'view_state', 'set_state'],
            },
        });

        console.log(`%c${userName}:Joined activity "${type}:${id}"`, logStyle);
    }

    public async hasProject(name: string)
    {
        const results = await this.domain.models()
            .query(`SELECT * FROM projects WHERE name = '${name}'`);

        if (results.totalResults > 0)
        {
            return true;
        }

        return false;
    }

    public async closeProject()
    {
        if (this._model)
        {
            await this._model.close();
            delete this._model;
        }
    }

    public async deleteProject(id: string)
    {
        await this.domain.models().remove(id);

        console.log(`%c${userName}:Delete project "${id}"`, logStyle);
    }

    public unRegisterNode(id: string)
    {
        if (!this.nodeRealtimeObjects.has(id))
        {
            throw new Error(`Cannot remove Node "${id}" as RealTimeObject is not registered.`);
        }

        this.nodeRealtimeObjects.delete(id);

        console.log(`${userName}:Unregistered RealTimeObject "${id}"`);
    }

    public getNodeElement(id: string)
    {
        const nodeElement = this.nodeRealtimeObjects.get(id);

        if (!nodeElement)
        {
            throw new Error(`Node "${id}" RealTimeObject not registered.`);
        }

        return nodeElement;
    }
}
