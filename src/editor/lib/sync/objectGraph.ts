import  type  { RealTimeObject } from '@convergence/convergence';
import { EventEmitter } from 'eventemitter3';

import { CloneInfo } from '../../../core/lib/nodes/cloneInfo';
import type { CustomPropertyType, CustomPropertyValueType } from '../../../core/lib/nodes/customProperties';
import { createGraphNode, getGraphNode } from '../../../core/lib/nodes/factory';
import type { Datastore } from './datastore';
import { hydrate } from './hydrate';
import type { NodeSchema } from './schema';

export type ObjectGraphEvent = 'objectGraphNodeCreated';

export class ObjectGraph extends EventEmitter<ObjectGraphEvent>
{
    public datastore: Datastore;

    constructor(datastore: Datastore)
    {
        super();

        this.datastore = datastore;
    }

    public hydrate(datastore: Datastore)
    {
        hydrate(datastore).forEach((node) => this.emit('objectGraphNodeCreated', node));
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
        this.datastore.registerNode(id, nodeElement);

        // notify application
        this.emit('objectGraphNodeCreated', node);
    };

    public onDatastoreNodeSetParent = (parentId: string, childId: string) =>
    {
        const parentNode = getGraphNode(parentId);
        const childNode = getGraphNode(childId);

        if (parentNode && childNode)
        {
            parentNode.addChild(childNode);
        }
    };

    public onDataStoreCustomPropDefined = (
        id: string,
        name: string,
        type: CustomPropertyType,
        value: CustomPropertyValueType,
    ) =>
    {
        const node = getGraphNode(id);

        node?.setCustomProperty(name, type, value);
    };

    public onDatastoreNodeRemoved = (nodeId: string, parentId: string) =>
    {
        const parentNode = getGraphNode(parentId);
        const childNode = getGraphNode(nodeId);

        if (parentNode && childNode)
        {
            parentNode.removeChild(childNode);
        }
        else
        {
            throw new Error(`Could not find parent "${parentId}" or child "${nodeId}" to remove child`);
        }
    };
}
