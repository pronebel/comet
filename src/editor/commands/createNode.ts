import type { ModelBase } from '../../core/model/model';
import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import { CloneInfo } from '../../core/nodes/cloneInfo';
import { getInstance } from '../../core/nodes/instances';
import { createNode } from '../../core/nodes/nodeFactory';
import type { NodeSchema } from '../../core/nodes/schema';
import { AbstractCommand } from '../abstractCommand';
import type { Datastore } from '../sync/datastore';
import { AssignCustomPropCommand } from './assignCustomProp';
import { RemoveNodeCommand } from './removeNode';
import { SetCustomPropCommand } from './setCustomProp';

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
        const cloneInfo = new CloneInfo(cloneMode, cloner ? getInstance<ClonableNode>(cloner) : undefined);

        // create and register graph node
        const node = createNode<ClonableNode>(type,
            { id, model, cloneInfo });

        node.created = nodeSchema.created;

        if (nodeSchema.parent && !isNewNode)
        {
            const parentNode = getInstance<ClonableNode>(nodeSchema.parent);

            parentNode.addChild(node);
        }

        // build defined custom properties
        for (const [customKey, definedProp] of Object.entries(customProperties.defined))
        {
            const { type, value } = definedProp;

            new SetCustomPropCommand({ nodeId: id, customKey, type, value, updateMode: 'graphOnly' }).exec();
        }

        // build assigned custom properties
        for (const [modelKey, customKey] of Object.entries(customProperties.assigned))
        {
            new AssignCustomPropCommand({ nodeId: id, modelKey, customKey, updateMode: 'graphOnly' }).exec();
        }

        return { node };
    }

    public exec(): CreateNodeCommandReturn
    {
        const { datastore, params: { nodeSchema, isNewNode } } = this;

        return CreateNodeCommand.createNode(datastore, nodeSchema, isNewNode);
    }

    public undo(): void
    {
        const { params: { nodeSchema } } = this;
        const nodeId = nodeSchema.id;

        console.log('CreateNode');

        new RemoveNodeCommand({ nodeId, updateMode: 'full' }).exec();
    }
}
