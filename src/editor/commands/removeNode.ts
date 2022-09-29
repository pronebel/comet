import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import { getInstance, unregisterInstance } from '../../core/nodes/instances';
import { type NodeSchema, getCloneInfoSchema } from '../../core/nodes/schema';
import { type UpdateMode, AbstractCommand } from '../abstractCommand';

export interface RemoveNodeCommandParams
{
    nodeId: string;
    updateMode: UpdateMode;
}

export interface RemoveNodeCommandReturn
{
    node: ClonableNode;
    parentNode: ClonableNode;
}

export interface RemoveNodeCommandCache
{
    nodeSchema: NodeSchema;
    parentId: string;
}
export class RemoveNodeCommand
    extends AbstractCommand<RemoveNodeCommandParams, RemoveNodeCommandReturn, RemoveNodeCommandCache>
{
    public static commandName = 'RemoveNode';

    public exec(): RemoveNodeCommandReturn
    {
        const { datastore, params: { nodeId, updateMode } } = this;

        const node = getInstance<ClonableNode>(nodeId);
        const parentNode = node.parent;

        if (!parentNode)
        {
            throw new Error(`Cannot remove node "${nodeId}" which has no parent`);
        }

        const parentId = parentNode.id;

        if (updateMode === 'graphOnly')
        {
            // just unregister it, already removed from data
            datastore.unRegisterNode(nodeId);
        }
        else
        {
            // delete data from datastore
            datastore.removeNode(nodeId, parentId);
        }

        // track cloner before removeChild
        const cloner = node.cloneInfo.getCloner<ClonableNode>();

        // remove from parent graph node
        parentNode.removeChild(node);

        // update node cloneInfo
        if (cloner)
        {
            datastore.updateNodeCloneInfo(cloner.id, getCloneInfoSchema(cloner));
        }

        // unregister graph node
        unregisterInstance(node);

        return { node, parentNode: parentNode.cast<ClonableNode>() };
    }

    public undo(): void
    {
        // const { cache: { nodeSchema, parentId } } = this;

        // const { node } = new CreateNodeCommand({ nodeSchema, isNewNode: true }).exec();
        // new SetParentCommand()
    }
}
