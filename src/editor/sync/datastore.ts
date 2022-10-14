import Convergence, {
    type ConvergenceDomain,
    type IConvergenceEvent,
    type ObjectSetEvent,
    type RealTimeArray,
    type RealTimeModel,
    RealTimeObject,
} from '@convergence/convergence';
import { EventEmitter } from 'eventemitter3';

import type { ModelValue } from '../../core/model/model';
import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import { consolidateId, getInstance } from '../../core/nodes/instances';
import type { CloneInfoSchema, NodeSchema, ProjectSchema } from '../../core/nodes/schema';
import { createProjectSchema } from '../../core/nodes/schema';
import { Application } from '../application';
import type {
    DatastoreEvent,
    DSCloneInfoModifiedEvent,
    DSCustomPropAssignedEvent,
    DSCustomPropDefinedEvent,
    DSCustomPropUnassignedEvent,
    DSCustomPropUndefinedEvent,
    DSModelModifiedEvent,
    DSNodeCreatedEvent,
    DSNodeRemovedEvent,
    DSParentSetEvent,
} from './datastoreEvents';
import { getUserLogColor, getUserName } from './user';

const userName = getUserName();
const logStyle = 'color:LimeGreen';
const userColor = getUserLogColor(userName);
const logId = `${userName}`;

export const defaultProjectSettings = {
    collection: 'projects',
    overrideCollectionWorldPermissions: false,
    ephemeral: false,
    worldPermissions: { read: true, write: true, remove: true, manage: true },
};

export const connectionTimeout = 2500;

function objectSetEvent(e: IConvergenceEvent)
{
    const event = e as ObjectSetEvent;
    const nodeElement = event.element as RealTimeObject;
    const nodeId = nodeElement.get('id').value() as string;

    return { event, nodeElement, nodeId };
}

export class Datastore extends EventEmitter<DatastoreEvent>
{
    protected _domain?: ConvergenceDomain;
    protected _model?: RealTimeModel;
    protected nodeRealtimeObjects: Map<string, RealTimeObject>;

    public static instance: Datastore;

    constructor()
    {
        super();

        Datastore.instance = this;

        this.nodeRealtimeObjects = new Map();

        (window as any).DS = this;
    }

    protected get app()
    {
        return Application.instance;
    }

    protected get domain()
    {
        if (!this._domain)
        {
            throw new Error(`${logId}:Domain not found`);
        }

        return this._domain;
    }

    protected get model()
    {
        if (!this._model)
        {
            throw new Error(`${logId}:Datastore model not initialised`);
        }

        return this._model;
    }

    protected get nodes()
    {
        return this.model.elementAt('nodes') as RealTimeObject;
    }

    public reset()
    {
        this.nodeRealtimeObjects.clear();

        delete this._model;
    }

    public getRegisteredIds()
    {
        return Array.from(this.nodeRealtimeObjects.keys());
    }

    public setNodesData(data: Record<string, NodeSchema>)
    {
        this.nodes.value(data);
    }

    public toJSON(): ProjectSchema
    {
        return this.model.root().toJSON() as ProjectSchema;
    }

    public hasNodeElement(nodeId: string)
    {
        return this.nodes.hasKey(nodeId);
    }

    public hasRegisteredNodeElement(nodeId: string)
    {
        return this.nodeRealtimeObjects.has(nodeId);
    }

    public getNodeElementSchema(nodeId: string)
    {
        const nodeElement = this.getNodeElement(nodeId);

        return nodeElement.toJSON() as NodeSchema;
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
                console.log(`%c${logId}:%cConnected as "${userName}"`, userColor, logStyle);
                this._domain = domain;
                resolve(domain);
            }).catch(reject);
        });
    }

    public onNodeCreated = (e: IConvergenceEvent) =>
    {
        const { event } = objectSetEvent(e);
        const nodeElement = event.value as RealTimeObject;
        const nodeId = nodeElement.get('id').value() as string;

        consolidateId(nodeId);

        console.log(`%c${logId}:%c🟦 onNodeCreated: ${JSON.stringify(nodeElement.toJSON())}`, userColor, logStyle);

        this.registerNodeElement(nodeId, nodeElement);

        this.emit('nodeCreated', { nodeId } as DSNodeCreatedEvent);
    };

    public onNodeRemoved = (e: IConvergenceEvent) =>
    {
        const { event } = objectSetEvent(e);
        const nodeId = event.key;
        const nodeElement = event.oldValue as RealTimeObject;
        const parentId = nodeElement.get('parent').value() as string | undefined;

        console.log(`%c${logId}:%c🟦 onNodeRemoved: "${nodeId}"`, userColor, logStyle);

        this.unRegisterNode(nodeId);

        this.emit('nodeRemoved', { nodeId, parentId } as DSNodeRemovedEvent);
    };

    public onNodeRootPropertySet = (e: IConvergenceEvent) =>
    {
        const { event, nodeId } = objectSetEvent(e);
        const key = event.key;

        if (key === 'parent')
        {
            const parentId = event.value.value();
            const oldParentId = event.oldValue.value();

            console.log(
                `%c${logId}:%c🟦 onNodeRootPropertySet(parent): parentId: "${parentId}" 
                childId: "${nodeId}" oldParentId: "${oldParentId}"`, userColor, logStyle,
            );

            this.emit('parentSet', { parentId, nodeId } as DSParentSetEvent);
        }
    };

    public onNodeDefinedCustomPropSet = (e: IConvergenceEvent) =>
    {
        const { event, nodeElement } = objectSetEvent(e);
        const nodeId = (nodeElement.parent().parent() as RealTimeObject).get('id').value() as string;
        const customKey = event.key;
        const element = event.value as RealTimeObject;
        const { type, value } = element.toJSON();
        const info = JSON.stringify(element.toJSON());

        console.log(`%c${logId}:%c🟦 onNodeDefinedCustomPropSet: nodeId: "${nodeId}" info: ${info}`, userColor, logStyle);

        this.emit('customPropDefined', { nodeId, customKey, type, value } as DSCustomPropDefinedEvent);
    };

    public onNodeDefinedCustomPropRemoved = (e: IConvergenceEvent) =>
    {
        const { event, nodeElement } = objectSetEvent(e);
        const nodeId = (nodeElement.parent().parent() as RealTimeObject).get('id').value() as string;
        const customKey = event.key;

        console.log(
            `%c${logId}:%c🟦 onNodeDefinedCustomPropRemoved: nodeId: "${nodeId}" customKey: "${customKey}"`,
            userColor,
            logStyle,
        );

        this.emit('customPropUndefined', { nodeId, customKey } as DSCustomPropUndefinedEvent);
    };

    public onNodeAssignedCustomPropSet = (e: IConvergenceEvent) =>
    {
        const { event, nodeElement } = objectSetEvent(e);
        const nodeId = (nodeElement.parent().parent() as RealTimeObject).get('id').value() as string;
        const modelKey = event.key;
        const customKey = event.value.value() as string;

        console.log(
            `%c${logId}:%c🟦 onNodeAssignedCustomPropSet: nodeId: "${nodeId}" modelKey: "${modelKey}->${customKey}"`,
            userColor,
            logStyle,
        );

        this.emit('customPropAssigned', { nodeId, modelKey, customKey } as DSCustomPropAssignedEvent);
    };

    public onNodeAssignedCustomPropRemoved = (e: IConvergenceEvent) =>
    {
        const { event, nodeElement } = objectSetEvent(e);
        const nodeId = (nodeElement.parent().parent() as RealTimeObject).get('id').value() as string;
        const modelKey = event.key;

        console.log(`%c${logId}:%c🟦 onNodeAssignedCustomPropRemoved: nodeId: "${nodeId}" modelKey "${modelKey}"`,
            userColor,
            logStyle,
        );

        this.emit('customPropUnassigned', { nodeId, modelKey } as DSCustomPropUnassignedEvent);
    };

    public onNodeModelPropertySet = (e: IConvergenceEvent) =>
    {
        const { event, nodeElement } = objectSetEvent(e);
        const nodeId = (nodeElement.parent() as RealTimeObject).get('id').value() as string;
        const key = event.key;
        const value = event.value.value() as ModelValue;

        console.log(
            `%c${logId}:%c🟦 onNodeModelPropertySet: nodeId: "${nodeId}" key: "${key}" value: "${value}"`,
            userColor,
            logStyle,
        );

        this.emit('modelModified', { nodeId, key, value } as DSModelModifiedEvent);
    };

    public onNodeModelValueSet = (e: IConvergenceEvent) =>
    {
        const { event, nodeId } = objectSetEvent(e);
        const model = event.element.value() as object;

        console.log(`%c${logId}:%c🟦 onNodeModelValueSet: nodeId: "${nodeId}" ${JSON.stringify(model)}`, userColor, logStyle);

        this.emit('modelModified', { nodeId, key: null, value: model } as DSModelModifiedEvent);
    };

    public onNodeModelPropertyRemove = (e: IConvergenceEvent) =>
    {
        throw new Error(`${logId}:Model REMOVED event not supported yet ${e.name}`);
    };

    public onNodeCloneInfoValueSet = (e: IConvergenceEvent) =>
    {
        const { event, nodeElement } = objectSetEvent(e);
        const nodeId = (nodeElement.parent() as RealTimeObject).get('id').value() as string;
        const cloneInfo = event.element.value() as CloneInfoSchema;

        console.log(
            `%c${logId}:%c:🟦 onNodeCloneInfoValueSet: nodeId: "${nodeId}" ${JSON.stringify(cloneInfo)}`,
            userColor,
            logStyle,
        );

        this.emit('cloneInfoModified', { nodeId, ...cloneInfo } as DSCloneInfoModifiedEvent);
    };

    public trackExistingNodeElement(nodeId: string)
    {
        const nodeElement = this.nodes.get(nodeId) as RealTimeObject;

        if (!nodeElement)
        {
            throw new Error(`${logId}:Existing node "${nodeId}" RealTimeObject not found, cannot track.`);
        }

        if (!this.nodeRealtimeObjects.has(nodeId))
        {
        // index element
            this.nodeRealtimeObjects.set(nodeId, nodeElement);

            // track remote changes
            this.trackNodeElementRemoteEvents(nodeId);
        }
    }

    public async createProject(name: string, id?: string)
    {
        const data = createProjectSchema(name);

        const model = await this.domain.models().openAutoCreate({
            ...defaultProjectSettings,
            id,
            data,
        });

        console.log(`%c${logId}:%cCreated project "${model.modelId()}"`, userColor, logStyle);

        return await this.openProject(model.modelId());
    }

    public async openProject(id: string): Promise<ClonableNode>
    {
        const model = await this.domain.models().open(id);

        console.log(`%c${logId}:%cOpened project "${model.modelId()}"`, userColor, logStyle);

        this._model = model;

        await this.joinActivity('editProject', model.modelId());

        // catch events when a remote user adds or removes a node...
        this.nodes
            .on(RealTimeObject.Events.SET, this.onNodeCreated)
            .on(RealTimeObject.Events.REMOVE, this.onNodeRemoved);

        return this.hydrate();
    }

    protected trackNodeElementRemoteEvents(nodeId: string)
    {
        console.log(`%c${logId}:%ctrack nodeElement: "${nodeId}"`, userColor, logStyle);

        const nodeElement = this.getNodeElement(nodeId);

        // track remote events on node property changes
        nodeElement.on(RealTimeObject.Events.SET, this.onNodeRootPropertySet);

        // catch events on nodeElement custom prop defined changes (as a remote user)
        nodeElement.elementAt('customProperties', 'defined')
            .on(RealTimeObject.Events.SET, this.onNodeDefinedCustomPropSet)
            .on(RealTimeObject.Events.REMOVE, this.onNodeDefinedCustomPropRemoved);

        // catch events on nodeElement custom prop assigned changes (as a remote user)
        nodeElement.elementAt('customProperties', 'assigned')
            .on(RealTimeObject.Events.SET, this.onNodeAssignedCustomPropSet)
            .on(RealTimeObject.Events.REMOVE, this.onNodeAssignedCustomPropRemoved);

        // catch events from model
        nodeElement.elementAt('model')
            .on(RealTimeObject.Events.SET, this.onNodeModelPropertySet)
            .on(RealTimeObject.Events.VALUE, this.onNodeModelValueSet)
            .on(RealTimeObject.Events.REMOVE, this.onNodeModelPropertyRemove);

        // catch events from cloneInfo
        nodeElement.elementAt('cloneInfo')
            .on(RealTimeObject.Events.VALUE, this.onNodeCloneInfoValueSet);
    }

    public hydrate()
    {
        const { nodes } = this;

        // index all nodeElements
        nodes.keys().forEach((id) =>
        {
            const nodeElement = nodes.get(id) as RealTimeObject;

            this.registerNodeElement(id, nodeElement);
        });

        // get the root
        const rootId = this.model.root().get('root').value() as string;
        const projectNode = nodes.get(rootId) as RealTimeObject;

        if (projectNode)
        {
            // start hydrating from the root node (Project)
            this.hydrateElement(projectNode);
        }
        else
        {
            throw new Error(`${logId}:Could not find project node`);
        }

        return getInstance<ClonableNode>(rootId);
    }

    protected hydrateElement(nodeElement: RealTimeObject)
    {
        const id = nodeElement.get('id').value() as string;

        // ensure local ids don't clash with hydrating ids
        consolidateId(id);

        // create the graph node
        this.emit('nodeHydrated', { nodeId: id } as DSNodeCreatedEvent);

        // recursively create children
        (nodeElement.get('children').value() as RealTimeArray).forEach((id) =>
        {
            const childId = String(id);
            const childNodeElement = this.nodes.get(childId) as RealTimeObject;

            if (childNodeElement)
            {
                this.hydrateElement(childNodeElement);
            }
            else
            {
                throw new Error(`${logId}:Could not find childElement "${childId}"`);
            }
        });
    }

    public registerNodeElement(nodeId: string, nodeElement: RealTimeObject)
    {
        if (this.nodeRealtimeObjects.has(nodeId))
        {
            throw new Error(`${logId}:Node "${nodeId}" RealTimeObject already registered.`);
        }

        // store element
        this.nodeRealtimeObjects.set(nodeId, nodeElement);

        console.log(`%c${logId}:%cRegistered New RealTimeObject "${nodeId}"`, userColor, logStyle);

        // track remote events
        this.trackNodeElementRemoteEvents(nodeId);
    }

    public createNode(nodeSchema: NodeSchema)
    {
        console.log(
            `%c${logId}:%c🟩 createNode() nodeId: "${nodeSchema.id}" %c${JSON.stringify(nodeSchema)}`,
            userColor,
            logStyle,
            'color:#999',
        );

        if (this.nodes.hasKey(nodeSchema.id))
        {
            throw new Error(`${logId}:Node "${nodeSchema.id}" node already registered.`);
        }

        const nodeElement = this.nodes.set(nodeSchema.id, nodeSchema) as RealTimeObject;

        this.registerNodeElement(nodeSchema.id, nodeElement);

        if (nodeSchema.parent)
        {
            this.setNodeParent(nodeSchema.id, nodeSchema.parent);
        }
    }

    public removeNode(nodeId: string)
    {
        console.log(
            `%c${logId}:%c🟩 removeNode() nodeId: ${nodeId}`,
            userColor,
            logStyle,
        );

        const nodeElement = this.getNodeElement(nodeId);
        const parentId = nodeElement.get('parent').value() as string | undefined;

        // remove from nodes RealTimeObject
        this.nodes.remove(nodeId);

        if (parentId)
        {
            // remove child reference in parent element
            const parentElement = this.getNodeElement(parentId);
            const childArray = parentElement.get('children') as RealTimeArray;
            const index = childArray.findIndex((id) => id.value() === nodeId);

            if (index === -1)
            {
                throw new Error(`${logId}:Could not find child "${nodeId}" reference in parent "${parentId}"`);
            }

            childArray.remove(index);
        }

        // unregister RealTimeObject for node
        this.unRegisterNode(nodeId);
    }

    public setNodeParent(childId: string, parentId: string)
    {
        console.log(
            `%c${logId}:%c🟩 setNodeParent() childId: ${childId} parentId: ${parentId}`,
            userColor,
            logStyle,
        );

        const parentElement = this.getNodeElement(parentId);
        const childElement = this.getNodeElement(childId);

        // set parent data
        childElement.set('parent', parentId);

        // set children data if not present
        const childArray = parentElement.get('children') as RealTimeArray;
        const index = childArray.findIndex((id) => id.value() === childId);

        if (index === -1)
        {
            childArray.push(childId);
        }
    }

    public modifyNodeModel(nodeId: string, values: object)
    {
        console.log(
            `%c${logId}:%c🟩 modifyNodeModel() nodeId: ${nodeId} values: ${JSON.stringify(values)}`,
            userColor,
            logStyle,
        );

        const nodeElement = this.getNodeElement(nodeId);
        const modelElement = nodeElement.get('model') as RealTimeObject;

        const entries = Object.entries(values);

        if (entries.length > 0)
        {
            this.batch(() =>
            {
                for (const [k, v] of entries)
                {
                    modelElement.set(k, v);
                }
            });
        }
    }

    public updateNodeCloneInfo(nodeId: string, cloneInfoSchema: CloneInfoSchema)
    {
        console.log(
            `%c${logId}:%c🟩 updateNodeCloneInfo() nodeId: ${nodeId} cloneInfoSchema: ${JSON.stringify(cloneInfoSchema)}`,
            userColor,
            logStyle,
        );

        const nodeElement = this.getNodeElement(nodeId);

        nodeElement.get('cloneInfo').value(cloneInfoSchema);
    }

    public async disconnect()
    {
        if (!this.domain.isDisposed())
        {
            await this.domain.disconnect();
            await this.domain.dispose();
            console.log(`%c${logId}:%cDomain disposed`, userColor, logStyle);
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

        console.log(`%c${logId}:%cJoined activity "${type}:${id}"`, userColor, logStyle);
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

        console.log(`%c${logId}:%cDelete project "${id}"`, userColor, logStyle);
    }

    public unRegisterNode(id: string)
    {
        if (!this.nodeRealtimeObjects.has(id))
        {
            throw new Error(`${logId}:Cannot remove Node "${id}" as RealTimeObject is not registered.`);
        }

        this.nodeRealtimeObjects.delete(id);

        console.log(`%c${logId}:%cUnregistered RealTimeObject "${id}"`, userColor, logStyle);
    }

    public getNodeElement(id: string)
    {
        const nodeElement = this.nodeRealtimeObjects.get(id);

        if (!nodeElement)
        {
            throw new Error(`${logId}:Node "${id}" RealTimeObject not registered.`);
        }

        return nodeElement;
    }
}
