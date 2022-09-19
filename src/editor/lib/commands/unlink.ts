import type { ClonableNode } from '../../../core/lib/nodes/abstract/clonableNode';
import { getGraphNode } from '../../../core/lib/nodes/factory';
import { getCloneInfoSchema } from '../sync/schema';
import { Command } from '.';

export class UnlinkCommand extends Command
{
    constructor(
        public readonly nodeId: string,
    )
    {
        super();
    }

    public name()
    {
        return 'Unlink';
    }

    public apply(): void
    {
        const { nodeId, datastore } = this;

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
