import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import { getInstance } from '../../core/nodes/instances';
import { getCloneInfoSchema, getNodeSchema } from '../../core/nodes/schema';
import { Command } from '../command';

export interface RemoveNodeCommandParams
{
    nodeId: string;
}

export interface RemoveNodeCommandReturn
{
    node: ClonableNode;
}

export interface RemoveNodeCommandCache
{
    parentId: string;
}

export class RemoveNodeCommand
    extends Command<RemoveNodeCommandParams, RemoveNodeCommandReturn, RemoveNodeCommandCache>
{
    public static commandName = 'RemoveNode';

    public apply(): RemoveNodeCommandReturn
    {
        const { datastore, params: { nodeId }, cache } = this;

        const node = getInstance<ClonableNode>(nodeId);
        const parentNode = node.parent;

        // delete data from datastore
        if (datastore.hasNodeElement(nodeId))
        {
            datastore.removeNode(nodeId);
        }

        // remove from parent graph node
        if (parentNode)
        {
            cache.parentId = parentNode.id;
            parentNode.removeChild(node);
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
        const { datastore, params: { nodeId }, cache: { parentId } } = this;

        const node = getInstance<ClonableNode>(nodeId);
        const nodeSchema = getNodeSchema(node);

        if (!datastore.hasNodeElement(nodeId))
        {
            datastore.createNode(nodeSchema);
        }

        const parentNode = getInstance<ClonableNode>(parentId);

        if (parentNode && node.parent !== parentNode)
        {
            parentNode.addChild(node);
            datastore.setNodeParent(node.id, parentNode.id, true);
        }

        // update node cloneInfo
        const cloner = node.cloneInfo.getCloner<ClonableNode>();

        if (cloner)
        {
            // update clone info
            cloner.cloneInfo.addCloned(node);
            datastore.updateNodeCloneInfo(cloner.id, getCloneInfoSchema(cloner));
        }
    }
}
