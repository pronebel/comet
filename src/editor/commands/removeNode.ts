import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import { getInstance, hasInstance, isInstanceInTrash, moveToTrash, restoreInstance } from '../../core/nodes/instances';
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

            // keep reference to parent in case of restore required
            node.parent = parentNode;
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

    public undo()
    {
        const { datastore, params: { nodeId } } = this;

        // restore node from trash
        if (!isInstanceInTrash(nodeId) && hasInstance(nodeId))
        {
            // node has already been restored by remote user action, abort
            return;
        }

        const node = restoreInstance<ClonableNode>(nodeId);

        // restore datastore data
        const nodeSchema = getNodeSchema(node);

        datastore.createNode(nodeSchema);

        const parentNode = node.parent;

        if (parentNode)
        {
            delete node.parent;
            parentNode.addChild(node);
            datastore.setNodeParent(node.id, parentNode.id, true);
        }

        // update node cloneInfo
        const cloner = node.cloneInfo.getCloner<ClonableNode>();

        if (cloner)
        {
            cloner.cloneInfo.addCloned(node);
            datastore.updateNodeCloneInfo(cloner.id, getCloneInfoSchema(cloner));
        }
    }

    public assert(): void
    {
        this.app.assertNode(this.params.nodeId);
    }
}
