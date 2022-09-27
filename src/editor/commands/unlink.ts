import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import { getGraphNode } from '../../core/nodes/nodeFactory';
import { getCloneInfoSchema } from '../../core/nodes/schema';
import { AbstractCommand } from '../abstractCommand';

export interface UnlinkCommandParams
{
    nodeId: string;
}

export class UnlinkCommand extends AbstractCommand<UnlinkCommandParams>
{
    public static commandName = 'Unlink';

    public exec(): void
    {
        const { datastore, params: { nodeId } } = this;

        const node = getGraphNode(nodeId);

        node.walk<ClonableNode>((node) =>
        {
            const nodeId = node.id;

            // unlink graph node
            node.unlink();

            // update datastore with new cloneInfo and model values
            datastore.updateNodeCloneInfo(nodeId, getCloneInfoSchema(node));
            datastore.modifyNodeModel(nodeId, node.model.ownValues);

            // call this command on all cloned nodes from this node
            node.cloneInfo.forEachCloned<ClonableNode>((clone) => new UnlinkCommand({ nodeId: clone.id }).exec());
        });
    }

    public undo(): void
    {
        throw new Error('Method not implemented.');
    }
}
