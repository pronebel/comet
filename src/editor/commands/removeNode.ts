import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import { getInstance, moveToTrash, restoreInstance } from '../../core/nodes/instances';
import { getCloneInfoSchema, getNodeSchema } from '../../core/nodes/schema';
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
export interface RemoveNodeCommandCache
{
    parentId?: string;
}

export class RemoveNodeCommand
    extends Command<RemoveNodeCommandParams, RemoveNodeCommandReturn, RemoveNodeCommandCache>
{
    public static commandName = 'RemoveNode';

    public apply(): RemoveNodeCommandReturn
    {
        const { datastore, params: { nodeId, updateMode }, cache } = this;

        const node = getInstance<ClonableNode>(nodeId);
        const parentNode = node.parent;

        // move to trash
        moveToTrash(node);

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

        // remove from parent graph node
        if (parentNode)
        {
            parentNode.removeChild(node);
            cache.parentId = parentNode.id;
        }

        // update node cloneInfo
        const cloner = node.cloneInfo.getCloner<ClonableNode>();

        if (cloner)
        {
            cloner.cloneInfo.removeCloned(node);
            datastore.updateNodeCloneInfo(cloner.id, getCloneInfoSchema(cloner));
        }

        return { node };
    }

    public undo(): void
    {
        const { datastore, params: { nodeId }, cache } = this;

        // restore node from trash
        const node = restoreInstance<ClonableNode>(nodeId);

        // restore datastore data
        const nodeSchema = getNodeSchema(node);

        datastore.createNode(nodeSchema);

        // add from parent graph node
        if (cache.parentId)
        {
            const parentNode = getInstance<ClonableNode>(cache.parentId);

            parentNode.addChild(node);
        }

        // update node cloneInfo
        const cloner = node.cloneInfo.getCloner<ClonableNode>();

        if (cloner)
        {
            cloner.cloneInfo.addCloned(node);
            datastore.updateNodeCloneInfo(cloner.id, getCloneInfoSchema(cloner));
        }
    }
}
