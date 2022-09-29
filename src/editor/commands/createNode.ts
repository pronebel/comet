import type { ModelBase } from '../../core/model/model';
import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import { CloneInfo } from '../../core/nodes/cloneInfo';
import { getInstance, newId } from '../../core/nodes/instances';
import { createNode } from '../../core/nodes/nodeFactory';
import type { NodeSchema } from '../../core/nodes/schema';
import { AbstractCommand } from '../abstractCommand';
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

    public apply(): CreateNodeCommandReturn
    {
        const { datastore, params: { nodeSchema, isNewNode }, hasRun } = this;

        const { type, model, cloneInfo: { cloneMode, cloner }, customProperties } = nodeSchema;

        if (hasRun)
        {
            const newNodeId = newId(type);
            const oldNodeId = nodeSchema.id;

            this.updateAllFollowingCommands((command) => command.updateNodeId(oldNodeId, newNodeId));
        }

        if (isNewNode)
        {
            // create datastore entry
            datastore.createNode(nodeSchema);
        }
        else
        {
            // just register the model, we are loading existing nodes
            datastore.trackExistingNodeElement(nodeSchema.id);
        }

        // build clone info
        const cloneInfo = new CloneInfo(cloneMode, cloner ? getInstance<ClonableNode>(cloner) : undefined);

        // create and register graph node
        const node = createNode<ClonableNode>(type,
            { id: nodeSchema.id, model, cloneInfo });

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

            new SetCustomPropCommand({ nodeId: nodeSchema.id, customKey, type, value, updateMode: 'graphOnly' }).run();
        }

        // build assigned custom properties
        for (const [modelKey, customKey] of Object.entries(customProperties.assigned))
        {
            new AssignCustomPropCommand({ nodeId: nodeSchema.id, modelKey, customKey, updateMode: 'graphOnly' }).run();
        }

        return { node };
    }

    public undo(): void
    {
        const { params: { nodeSchema } } = this;
        const nodeId = nodeSchema.id;

        new RemoveNodeCommand({ nodeId, updateMode: 'full' }).run();
    }
}
