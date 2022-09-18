import { getGraphNode } from '../../../core/lib/nodes/factory';
import { Command } from '.';

export class RemoveNodeCommand extends Command
{
    constructor(
        public readonly nodeId: string,
    )
    {
        super();
    }

    public name()
    {
        return 'RemoveNode';
    }

    public apply(): void
    {
        const { datastore, nodeId } = this;

        const node = getGraphNode(nodeId);

        if (node)
        {
            const childIds = node.walk((childNode, { data }) =>
            {
                data.push(childNode.id);
            }, { data: [] }) as string[];

            childIds.reverse();

            childIds.forEach((nodeId) => datastore.removeNode(nodeId));
        }

        // todo: store deleted nodes for undo
    }

    public undo(): void
    {
        throw new Error('Method not implemented.');
    }
}
