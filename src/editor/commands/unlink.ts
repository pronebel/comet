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
            // unlink graph node
            node.unlink();

            // update datastore with new cloneInfo and model values
            const nodeId = node.id;
            const nodeElement = datastore.getNodeElement(nodeId);
            const cloneInfoSchema = getCloneInfoSchema(node);

            nodeElement.get('cloneInfo').value(cloneInfoSchema);
            nodeElement.get('model').value(node.model.ownValues);
        });
    }

    public undo(): void
    {
        throw new Error('Method not implemented.');
    }
}
