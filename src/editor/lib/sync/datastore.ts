import type { ConvergenceDomain, IConvergenceEvent, ObjectSetEvent, RealTimeModel } from '@convergence/convergence';
import Convergence, { RealTimeObject } from '@convergence/convergence';
import { EventEmitter } from 'eventemitter3';

import type { ModelBase } from '../../../core/lib/model/model';
import type { ClonableNode } from '../../../core/lib/nodes/abstract/clonableNode';
import type { GraphNode } from '../../../core/lib/nodes/abstract/graphNode';
import type { CustomPropertyType, CustomPropertyValueType } from '../../../core/lib/nodes/customProperties';
import { trackNodeId } from '../../../core/lib/nodes/factory';
import type { ObjectGraph } from './objectGraph';
import { type NodeOptionsSchema, type NodeSchema, createProjectSchema } from './schema';
import { getUserName } from './user';

const userName = getUserName();

export const defaultProjectSettings = {
    collection: 'projects',
    overrideCollectionWorldPermissions: false,
    ephemeral: false,
    worldPermissions: { read: true, write: true, remove: true, manage: true },
};

export type DatastoreEvents =
| 'datastoreNodeCreated'
| 'datastoreNodeSetParent'
| 'datastoreNodeRemoved'
| 'datastoreCustomPropDefined'
| 'datastoreCustomPropUndefined';

const logStyle = 'color:cyan';

export class Datastore extends EventEmitter<DatastoreEvents>
{
    protected _domain?: ConvergenceDomain;
    protected _model?: RealTimeModel;
    public nodeRealtimeObjects: Map<string, RealTimeObject>;

    constructor()
    {
        super();
        this.nodeRealtimeObjects = new Map();
    }

    protected async initModel(projectModel: RealTimeModel)
    {
        this._model = projectModel;

        await this.joinActivity('editProject', projectModel.modelId());

        // catch events when a remote user...
        this.nodes.on(RealTimeObject.Events.SET, (event: IConvergenceEvent) =>
        {
            const nodeElement = (event as ObjectSetEvent).value as RealTimeObject;
            const nodeId = nodeElement.get('id').value() as string;
            const parentId = nodeElement.get('parent').value() as string | undefined;

            trackNodeId(nodeId);

            console.log(`%c${userName}:nodes.set: ${JSON.stringify(nodeElement.toJSON())}`, logStyle);

            this.registerNode(nodeId, nodeElement);

            this.emit('datastoreNodeCreated', nodeElement);

            if (parentId)
            {
                const childId = nodeElement.get('id').value() as string;

                this.emit('datastoreNodeSetParent', parentId, childId);
            }
        }).on(RealTimeObject.Events.REMOVE, (event: IConvergenceEvent) =>
        {
            const nodeId = (event as ObjectSetEvent).key;

            const nodeElement = (event as ObjectSetEvent).oldValue as RealTimeObject;
            const parentId = nodeElement.get('parent').value() as string | undefined;

            console.log(`%c${userName}:nodes.remove: ${nodeId}`, logStyle);

            if (parentId)
            {
                this.emit('datastoreNodeRemoved', nodeId, parentId);
            }
        });
    }

    public hydrate(objectGraph: ObjectGraph)
    {
        const { nodes } = this;

        const graphNodes: Map<string, ClonableNode> = new Map();

        nodes.keys().forEach((id) =>
        {
            // ensure local ids don't clash with hydrating ids
            trackNodeId(id);

            const nodeElement = nodes.get(id) as RealTimeObject;
            const nodeSchema = nodeElement.toJSON() as NodeSchema<{}>;

            const node = objectGraph.createNode(nodeSchema);

            this.registerNode(id, nodeElement);

            graphNodes.set(id, node);
        });

        nodes.keys().forEach((id) =>
        {
            const nodeElement = nodes.get(id) as RealTimeObject;

            const parentId = nodeElement.get('parent').value();
            const childId = nodeElement.get('id').value();
            const parentNode = graphNodes.get(parentId);
            const childNode = graphNodes.get(childId);

            if (parentNode && childNode)
            {
                parentNode.addChild(childNode as GraphNode);
            }
        });

        return graphNodes;
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

    public async connect()
    {
        const url = 'https://localhost/realtime/convergence/default';

        const domain = await Convergence.connect(url, userName, 'password', {
            models: {
                data: {
                    undefinedObjectValues: 'omit',
                    undefinedArrayValues: 'null',
                },
            },
        });

        console.log(`%cConnected as ${userName}!`, 'color:lime');

        this._domain = domain;
    }

    public disconnect(): void
    {
        if (!this.domain.isDisposed())
        {
            this.domain.dispose();
            console.log('%c${userName}:Domain disposed', logStyle);
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

        console.log(`%c${userName}:Created project "${model.modelId()}"`, logStyle);

        await this.openProject(model.modelId());
    }

    public async openProject(id: string)
    {
        const model = await this.domain.models().open(id);

        console.log(`%c${userName}:Opened project "${model.modelId()}"`, logStyle);

        await this.initModel(model);
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

    public registerNode(id: string, nodeElement: RealTimeObject)
    {
        if (this.nodeRealtimeObjects.has(id))
        {
            throw new Error(`Node "${id}" RealTimeObject already registered.`);
        }

        // track element
        this.nodeRealtimeObjects.set(id, nodeElement);

        // catch events on nodeElement prop changes (as a remote user)
        nodeElement.on(RealTimeObject.Events.SET, (event: IConvergenceEvent) =>
        {
            const key = (event as ObjectSetEvent).key;

            if (key === 'parent')
            {
                const parentId = (event as ObjectSetEvent).value.value();
                const childId = nodeElement.get('id').value();

                console.log(`%c${userName}:parent.set: ${parentId} ${childId}`, logStyle);

                this.emit('datastoreNodeSetParent', parentId, childId);
            }
        });

        // catch custom prop events on nodeElement prop changes (as a remote user)
        nodeElement.elementAt('customProperties', 'defined').on(RealTimeObject.Events.SET, (event: IConvergenceEvent) =>
        {
            const name = (event as ObjectSetEvent).key;
            const element = (event as ObjectSetEvent).value as RealTimeObject;
            const { type, value } = element.toJSON();
            const info = JSON.stringify(element.toJSON());

            console.log(`%c${userName}:customProperties.set: ${info}`, logStyle);

            this.emit('datastoreCustomPropDefined', id, name, type, value);
        }).on(RealTimeObject.Events.REMOVE, (event: IConvergenceEvent) =>
        {
            const propName = (event as ObjectSetEvent).key;

            this.emit('datastoreCustomPropUndefined', id, propName);
        });

        console.log(`${userName}:Registered RealTimeObject "${id}"`);
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

    public getNode(id: string)
    {
        const nodeElement = this.nodeRealtimeObjects.get(id);

        if (!nodeElement)
        {
            throw new Error(`Node "${id}" RealTimeObject not registered.`);
        }

        return nodeElement;
    }

    // API used by Commands

    public createNode<M extends ModelBase>(nodeSchema: NodeSchema<M>, nodeOptions: NodeOptionsSchema<M>)
    {
        const nodeElement = this.nodes.set(nodeSchema.id, nodeSchema) as RealTimeObject;

        this.registerNode(nodeSchema.id, nodeElement);

        this.emit('datastoreNodeCreated', nodeElement);

        if (nodeOptions.parent)
        {
            const parentId = nodeOptions.parent;
            const childId = nodeSchema.id;

            this.emit('datastoreNodeSetParent', parentId, childId);
        }
    }

    public setNodeParent(parentId: string, childId: string)
    {
        const nodeElement = this.getNode(childId);

        nodeElement.set('parent', parentId);

        this.emit('datastoreNodeSetParent', parentId, childId);
    }

    public removeNode(nodeId: string)
    {
        const nodeElement = this.getNode(nodeId);

        const parentId = nodeElement.get('parent').value() as string;

        this.nodes.remove(nodeId);
        this.unRegisterNode(nodeId);

        this.emit('datastoreNodeRemoved', nodeId, parentId);
    }

    public setNodeCustomProperty(nodeId: string, propName: string, type: CustomPropertyType, value: CustomPropertyValueType)
    {
        const nodeElement = this.getNode(nodeId);
        const definedCustomProps = nodeElement.elementAt('customProperties', 'defined') as RealTimeObject;

        definedCustomProps.set(propName, {
            type,
            value,
        });

        this.emit('datastoreCustomPropDefined', nodeId, propName, type, value);
    }

    public removeNodeCustomProperty(nodeId: string, propName: string)
    {
        const nodeElement = this.getNode(nodeId);
        const definedCustomProps = nodeElement.elementAt('customProperties', 'defined') as RealTimeObject;

        definedCustomProps.remove(propName);

        this.emit('datastoreCustomPropUndefined', nodeId, propName);
    }
}
