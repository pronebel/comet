import type { ClonableNode } from '../../../core/lib/nodes/abstract/clonableNode';
import { getAllCloneUpdateRefs } from '../../../core/lib/nodes/abstract/clonableNode';
import { sortNode } from '../../../core/lib/nodes/abstract/graphNode';
import { CloneMode } from '../../../core/lib/nodes/cloneInfo';
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
            const deleteNodes: ClonableNode[] = [];
            const linkedNodes = getAllCloneUpdateRefs(node, true)
                .filter((node) => node.cloneInfo.cloneMode !== CloneMode.Original);

            deleteNodes.push(...linkedNodes);
            linkedNodes.forEach((node) =>
            {
                deleteNodes.push(...node.allChildren<ClonableNode>());
            });

            deleteNodes.sort(sortNode<number>('created')).reverse();

            const deleteNodeIds = deleteNodes.map((node) => node.id);

            console.log('Delete ids:', deleteNodeIds);

            deleteNodeIds.forEach((nodeId) => datastore.removeNode(nodeId));
        }
    }

    public undo(): void
    {
        throw new Error('Method not implemented.');
    }
}
