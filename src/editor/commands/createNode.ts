import type { ModelBase } from '../../core/model/model';
import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import { CloneInfo } from '../../core/nodes/cloneInfo';
import { createGraphNode, getGraphNode } from '../../core/nodes/nodeFactory';
import type { NodeSchema } from '../../core/nodes/schema';
import { AbstractCommand } from '../abstractCommand';
import type { Datastore } from '../sync/datastore';

export interface CreateNodeCommandParams<M extends ModelBase>
{
    nodeSchema: NodeSchema<M>;
    isNewNode: boolean;
}

export interface CreateNodeCommandReturn
{
    node: ClonableNode;
}

export class CreateNodeCommand<
    M extends ModelBase = ModelBase,
> extends AbstractCommand<CreateNodeCommandParams<M>, CreateNodeCommandReturn>
{
    public static commandName = 'CreateNode';

    public static createNode(datastore: Datastore, nodeSchema: NodeSchema, isNewNode: boolean): CreateNodeCommandReturn
    {
        const { type, id, model, cloneInfo: { cloneMode, cloner }, customProperties } = nodeSchema;

        if (isNewNode)
        {
            // create datastore entry
            datastore.createNodeSchema(nodeSchema);
        }
        else
        {
            // just register the model, we are loading existing nodes
            datastore.registerExistingNode(nodeSchema.id);
        }

        // build clone info
        const cloneInfo = new CloneInfo(cloneMode, cloner ? getGraphNode(cloner) : undefined);

        // create and register graph node
        const node = createGraphNode(type,
            { id, model, cloneInfo });

        node.created = nodeSchema.created;

        if (nodeSchema.parent && !isNewNode)
        {
            const parentNode = getGraphNode(nodeSchema.parent);

            parentNode.addChild(node);
        }

        // build defined custom properties
        for (const [name, definedProp] of Object.entries(customProperties.defined))
        {
            node.setCustomProperty(name, definedProp.type, definedProp.value);
        }

        // build assigned custom properties
        for (const [modelKey, customKey] of Object.entries(customProperties.assigned))
        {
            node.assignCustomProperty(modelKey, customKey);
        }

        return { node: node as ClonableNode };
    }

    public exec(): CreateNodeCommandReturn
    {
        const { datastore, params: { nodeSchema, isNewNode } } = this;

        return CreateNodeCommand.createNode(datastore, nodeSchema, isNewNode);
    }

    public undo(): void
    {
        throw new Error('Method not implemented.');
    }
}
