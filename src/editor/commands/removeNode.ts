import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import { getInstance } from '../../core/nodes/instances';
import { getNodeSchema } from '../../core/nodes/schema';
import { Command } from '../core/command';

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

    public get targetNodeId()
    {
        return this.params.nodeId;
    }

    public apply(): RemoveNodeCommandReturn
    {
        const { datastore, params: { nodeId } } = this;

        const node = getInstance<ClonableNode>(nodeId);

        if (datastore.hasNode(nodeId))
        {
            datastore.removeNode(nodeId);
        }

        node.cloak();

        return { node };
    }

    public undo()
    {
        const { datastore, params: { nodeId } } = this;

        const node = getInstance<ClonableNode>(nodeId);
        const nodeSchema = getNodeSchema(node);

        if (!datastore.hasNode(nodeId))
        {
            datastore.createNode(nodeSchema);
        }

        node.uncloak();
    }
}
