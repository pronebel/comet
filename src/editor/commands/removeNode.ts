import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import { getInstance } from '../../core/nodes/instances';
import { getNodeSchema } from '../../core/nodes/schema';
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
            const cloneInfoSchema = cloner.cloneInfo.clone().removeCloned(node).toSchema();

            datastore.updateNodeCloneInfo(cloner.id, cloneInfoSchema);
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
            const cloneInfoSchema = cloner.cloneInfo.clone().addCloned(node).toSchema();

            datastore.updateNodeCloneInfo(cloner.id, cloneInfoSchema);
        }
    }
}
