import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import { getInstance, moveToTrash } from '../../core/nodes/instances';
import { getCloneInfoSchema } from '../../core/nodes/schema';
import { type UpdateMode, Command } from '../command';

export interface RemoveNodeCommandParams
{
    nodeId: string;
    updateMode: UpdateMode;
}

export interface RemoveNodeCommandReturn
{
    node: ClonableNode;
}

export class RemoveNodeCommand
    extends Command<RemoveNodeCommandParams, RemoveNodeCommandReturn>
{
    public static commandName = 'RemoveNode';

    public apply(): RemoveNodeCommandReturn
    {
        const { datastore, params: { nodeId, updateMode } } = this;

        const node = getInstance<ClonableNode>(nodeId);
        const parentNode = node.parent;

        // move to trash
        node.walk<ClonableNode>((node) => moveToTrash(node));

        if (updateMode === 'graphOnly')
        {
            // just unregister it, already removed from data
            datastore.unRegisterNode(nodeId);
        }
        else
        {
            // delete data from datastore
            datastore.removeNode(nodeId);
        }

        // track cloner before removeChild
        const cloner = node.cloneInfo.getCloner<ClonableNode>();

        // remove from parent graph node
        if (parentNode)
        {
            parentNode.removeChild(node);
        }

        // update node cloneInfo
        if (cloner)
        {
            datastore.updateNodeCloneInfo(cloner.id, getCloneInfoSchema(cloner));
        }

        // dispose
        node.dispose();

        return { node };
    }

    public undo(): void
    {
        throw new Error('Unimplemented');
    }
}
