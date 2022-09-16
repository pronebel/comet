import type { ObjectSetEvent } from '@convergence/convergence';
import { type IConvergenceEvent, RealTimeObject } from '@convergence/convergence';
import { EventEmitter } from 'eventemitter3';

import { CloneInfo } from '../../../core/lib/nodes/cloneInfo';
import { createGraphNode, getGraphNode } from '../../../core/lib/nodes/factory';
import type { Datastore } from './datastore';
import { hydrate } from './hydrate';
import type { NodeSchema } from './schema';
import { getUserName } from './user';

const userName = getUserName();

export type ObjectGraphEvent = 'objectGraphNodeCreated';

export class ObjectGraph extends EventEmitter<ObjectGraphEvent>
{
    public nodeRealtimeObjects: Map<string, RealTimeObject>;

    constructor()
    {
        super();
        this.nodeRealtimeObjects = new Map();
    }

    public registerNodeRealtimeObject(id: string, nodeElement: RealTimeObject)
    {
        if (this.nodeRealtimeObjects.has(id))
        {
            throw new Error(`Node "${id}" RealTimeObject already registered.`);
        }

        this.nodeRealtimeObjects.set(id, nodeElement);

        nodeElement.elementAt('customProperties').on(RealTimeObject.Events.SET, (event: IConvergenceEvent) =>
        {
            const element = (event as ObjectSetEvent).value as RealTimeObject;

            console.log(`%c${userName}:customProperties.set: ${nodeElement.toJSON()}`, 'color:blue');

            // this.emit('dataStoreNodeCreated', nodeElement);
        });

        console.log(`${userName}:Register RealTimeObject "${id}"`);
    }

    public onDatastoreNodeCreated = (nodeElement: RealTimeObject) =>
    {
        const nodeSchema = nodeElement.toJSON() as NodeSchema<{}>;
        const { type, id, model, cloneInfo: { cloneMode, cloner, cloned }, customProperties } = nodeSchema;

        // build clone info
        const cloneInfo = new CloneInfo(cloneMode, getGraphNode(cloner));

        cloned.forEach((id) =>
        {
            const node = getGraphNode(id);

            node && cloneInfo.cloned.push(node);
        });

        // create node

        const node = createGraphNode(type,
            { id, model, cloneInfo });

        // build custom properties
        for (const [name, { type, value }] of Object.entries(customProperties.defined))
        {
            node.setCustomProperty(name, type, value);
        }

        for (const [modelKey, customPropertyKey] of Object.entries(customProperties.assigned))
        {
            node.assignCustomProperty(modelKey, customPropertyKey);
        }

        // register RealTimeObject
        this.registerNodeRealtimeObject(id, nodeElement);

        // notify application
        this.emit('objectGraphNodeCreated', node);
    };

    public onDatastoreNodeChildAdded = (parentId: string, childId: string) =>
    {
        const parentNode = getGraphNode(parentId);
        const childNode = getGraphNode(childId);

        if (parentNode && childNode)
        {
            parentNode.addChild(childNode);
        }
    };

    public hydrate(datastore: Datastore)
    {
        hydrate(this, datastore).forEach((node) => this.emit('objectGraphNodeCreated', node));
    }
}
