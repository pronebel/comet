import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import { getInstance, newId, unregisterInstance } from '../../core/nodes/instances';
import { type NodeSchema, getCloneInfoSchema, getNodeSchema } from '../../core/nodes/schema';
import { type UpdateMode, AbstractCommand } from '../abstractCommand';
import { CreateNodeCommand } from './createNode';
import { SetParentCommand } from './setParent';

export interface RemoveNodeCommandParams
{
    nodeId: string;
    updateMode: UpdateMode;
}

export interface RemoveNodeCommandReturn
{
    node: ClonableNode;
    // parentNode: ClonableNode;
}

export interface RemoveNodeCommandCache
{
    nodeSchema: NodeSchema;
    parentId: string;
    oldNodeId: string;
}

export class RemoveNodeCommand
    extends AbstractCommand<RemoveNodeCommandParams, RemoveNodeCommandReturn, RemoveNodeCommandCache>
{
    public static commandName = 'RemoveNode';

    public apply(): RemoveNodeCommandReturn
    {
        const { cache, datastore, params: { nodeId, updateMode } } = this;

        const node = getInstance<ClonableNode>(nodeId);
        const parentNode = node.parent;

        // track nodeSchema for cache
        cache.nodeSchema = getNodeSchema(node);
        cache.oldNodeId = node.id;

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

            // track for cache
            cache.parentId = parentNode.id;
        }

        // update node cloneInfo
        if (cloner)
        {
            datastore.updateNodeCloneInfo(cloner.id, getCloneInfoSchema(cloner));
        }

        // unregister graph node
        unregisterInstance(node);

        // dispose
        node.dispose();

        return { node };
    }

    public undo(): void
    {
        const { cache: { nodeSchema, parentId, oldNodeId }, params } = this;

        const newNodeId = newId(nodeSchema.type);

        nodeSchema.id = newNodeId;
        params.nodeId = newNodeId;
        const { node } = new CreateNodeCommand({ nodeSchema, isNewNode: true }).run();

        new SetParentCommand({ nodeId: node.id, parentId }).run();

        this.updateAllCommands((command) => command.updateNodeId(oldNodeId, newNodeId));
    }
}
