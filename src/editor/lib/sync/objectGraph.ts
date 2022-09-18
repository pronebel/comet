import  type  { RealTimeObject } from '@convergence/convergence';
import { EventEmitter } from 'eventemitter3';

import type { ModelBase } from '../../../core/lib/model/model';
import { CloneInfo } from '../../../core/lib/nodes/cloneInfo';
import type { CustomPropertyType, CustomPropertyValueType } from '../../../core/lib/nodes/customProperties';
import { createGraphNode, disposeGraphNode, getGraphNode } from '../../../core/lib/nodes/factory';
import type { NodeSchema } from './schema';

export type ObjectGraphEvent = 'objectGraphNodeCreated' | 'objectGraphNodeRemoved' | 'objectGraphParentSet';

export class ObjectGraph extends EventEmitter<ObjectGraphEvent>
{
    public createNode<M extends ModelBase = {}>(nodeSchema: NodeSchema<M>)
    {
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

        // notify application
        this.emit('objectGraphNodeCreated', node);

        return node;
    }

    public onDatastoreNodeCreated = (nodeElement: RealTimeObject) =>
    {
        const nodeSchema = nodeElement.toJSON() as NodeSchema<{}>;

        const node = this.createNode(nodeSchema);

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

            // notify application
            this.emit('objectGraphParentSet', childNode, parentNode);
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

            // notify application
            this.emit('objectGraphNodeRemoved', nodeId, parentId);

            // remove from node graph map
            disposeGraphNode(childNode);
        }
        else
        {
            throw new Error(`Could not find parent "${parentId}" or child "${nodeId}" to remove child`);
        }
    };

    public onDatastoreCustomPropUndefined = (nodeId: string, propName: string) =>
    {
        const node = getGraphNode(nodeId);

        if (node)
        {
            node.removeCustomProperty(propName);
        }
    };
}
