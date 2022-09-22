import { EventEmitter } from 'eventemitter3';

import type { ModelBase } from '../../../core/lib/model/model';
import type { ClonableNode } from '../../../core/lib/nodes/abstract/clonableNode';
import { CloneInfo } from '../../../core/lib/nodes/cloneInfo';
import type { CustomPropertyType, CustomPropertyValueType } from '../../../core/lib/nodes/customProperties';
import { createGraphNode, disposeGraphNode, getGraphNode, registerGraphNode } from '../../../core/lib/nodes/factory';
import type {  CloneInfoSchema,  NodeSchema } from './schema';

export type ObjectGraphEvent = 'objectGraphNodeCreated' | 'objectGraphNodeRemoved' | 'objectGraphParentSet';

export class ObjectGraph extends EventEmitter<ObjectGraphEvent>
{
    public createGraphNode<M extends ModelBase = {}>(nodeSchema: NodeSchema<M>)
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

        node.created = nodeSchema.created;

        // build custom properties
        for (const [name, props] of Object.entries(customProperties.defined))
        {
            props.forEach(({ type, value }) => node.setCustomProperty(name, type, value));
        }

        for (const [modelKey, customPropertyKey] of Object.entries(customProperties.assigned))
        {
            node.assignCustomProperty(modelKey, customPropertyKey);
        }

        // notify application
        this.emit('objectGraphNodeCreated', node);

        return node;
    }

    public onDatastoreNodeCreated = (nodeSchema: NodeSchema, clonedNode?: ClonableNode) =>
    {
        let node = clonedNode;

        if (node)
        {
            registerGraphNode(node);
        }
        else
        {
            node = this.createGraphNode(nodeSchema);
        }

        // notify application
        this.emit('objectGraphNodeCreated', node);
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

    public onDatastoreNodeSetParent = (nodeId: string, parentId: string) =>
    {
        const childNode = getGraphNode(nodeId);
        const parentNode = getGraphNode(parentId);

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

        if (node)
        {
            node.setCustomProperty(name, type, value);
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

    public onDatastoreCustomPropAssigned = (nodeId: string, modelKey: string, customKey: string) =>
    {
        const node = getGraphNode(nodeId);

        if (node)
        {
            node.assignCustomProperty(modelKey, customKey);
        }
    };

    public onDatastoreCustomPropUnAssigned = (nodeId: string, modelKey: string) =>
    {
        const node = getGraphNode(nodeId);

        if (node)
        {
            node.unAssignCustomProperty(modelKey);
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public onDatastoreNodeCloned = (clonedNode: ClonableNode) =>
    {
        //
    };

    public onDatastoreModelModified = (nodeId: string, values: ModelBase) =>
    {
        const node = getGraphNode(nodeId);

        if (node)
        {
            node.model.setValues(values);
        }
    };

    public onDatastoreCloneInfoModified = (nodeId: string, cloneInfo: CloneInfoSchema) =>
    {
        const node = getGraphNode(nodeId);

        if (node)
        {
            const cloner = getGraphNode(cloneInfo.cloner);

            // update cloner
            delete node.cloneInfo.cloner;

            if (cloner)
            {
                node.cloneInfo.cloner = cloner;
            }

            // update cloned
            node.cloneInfo.cloned = [];

            cloneInfo.cloned.forEach((id) =>
            {
                const clonedNode = getGraphNode(id);

                if (clonedNode)
                {
                    node.cloneInfo.cloned.push(clonedNode);
                }
            });

            // update cloneMode
            node.cloneInfo.cloneMode = cloneInfo.cloneMode;
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public onDatastoreNodeUnlinked = (nodeId: string) =>
    {
        //
    };
}
