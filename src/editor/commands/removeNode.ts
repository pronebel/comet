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

export class RemoveNodeCommand
    extends Command<RemoveNodeCommandParams, RemoveNodeCommandReturn>
{
    public static commandName = 'RemoveNode';

    public apply(): RemoveNodeCommandReturn
    {
        const { datastore, params: { nodeId } } = this;

        const node = getInstance<ClonableNode>(nodeId);

        if (datastore.hasNodeElement(nodeId))
        {
            datastore.removeNode(nodeId);
        }

        node.cloak();

        // update node cloneInfo
        const cloner = node.cloneInfo.getCloner<ClonableNode>();

        if (cloner)
        {
            // todo: just modify schema not node
            cloner.cloneInfo.removeCloned(node);
            datastore.updateNodeCloneInfo(cloner.id, getCloneInfoSchema(cloner));
        }

        return { node };
    }

    public undo()
    {
        const { datastore, params: { nodeId } } = this;

        const node = getInstance<ClonableNode>(nodeId);
        const nodeSchema = getNodeSchema(node);

        if (!datastore.hasNodeElement(nodeId))
        {
            datastore.createNode(nodeSchema);
        }

        node.uncloak();

        // update node cloneInfo
        const cloner = node.cloneInfo.getCloner<ClonableNode>();

        if (cloner)
        {
            // todo: just modify schema not node
            cloner.cloneInfo.addCloned(node);
            datastore.updateNodeCloneInfo(cloner.id, getCloneInfoSchema(cloner));
        }
    }
}
