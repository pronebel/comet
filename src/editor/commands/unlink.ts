import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import { getGraphNode } from '../../core/nodes/factory';
import { getCloneInfoSchema } from '../../core/nodes/schema';
import { Command } from '.';

export class UnlinkCommand extends Command<{
    nodeId: string;
}>
{
    public static commandName = 'Unlink';

    public apply(): void
    {
        const { datastore, params: { nodeId } } = this;

        const node = getGraphNode(nodeId);

        if (node)
        {
            node.unlink();

            node.walk<ClonableNode>((node) =>
            {
                const nodeId = node.id;

                const nodeElement = datastore.getNodeElement(nodeId);

                const cloneInfoSchema = getCloneInfoSchema(node);

                nodeElement.get('cloneInfo').value(cloneInfoSchema);

                nodeElement.get('model').value(node.model.ownValues);

                datastore.emit('datastoreNodeUnlinked', nodeId);
            });
        }
    }

    public undo(): void
    {
        throw new Error('Method not implemented.');
    }
}
