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

            // preserve parent reference, though node has officially "unparented"
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
        const { datastore, params: { nodeId }, cache: { parentId } } = this;

        const node = getInstance<ClonableNode>(nodeId);
        const nodeSchema = getNodeSchema(node);

        if (datastore.hasNodeElement(nodeId))
        {
            // node is in both node graph and datastore
            return;
        }

        datastore.createNode(nodeSchema);

        const parentNode = getInstance<ClonableNode>(parentId);

        if (parentNode)
        {
            // delete restore reference, add node "formally"
            delete node.parent;

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
