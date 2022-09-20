import { getAllCloneUpdateRefs } from '../../../core/lib/nodes/abstract/clonableNode';
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
            const cloneRefs = getAllCloneUpdateRefs(node);

            const deleteNodeIds = cloneRefs.map((node) => node.id);

            deleteNodeIds.push(node.id);

            console.log('Clone refs:', deleteNodeIds);

            deleteNodeIds.forEach((nodeId) => datastore.removeNode(nodeId));
        }
    }

    public undo(): void
    {
        throw new Error('Method not implemented.');
    }
}
