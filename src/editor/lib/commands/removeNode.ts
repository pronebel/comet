import type { ClonableNode } from '../../../core/lib/nodes/abstract/clonableNode';
import { getAllCloneUpdateRefs } from '../../../core/lib/nodes/abstract/clonableNode';
import { sortNode } from '../../../core/lib/nodes/abstract/graphNode';
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
            const { isLinked, hasCloned, isReferenceRoot } = node.cloneInfo;
            const deleteNodes: ClonableNode[] = [node];

            if ((isLinked || hasCloned) && !isReferenceRoot)
            {
                const linkedNodes = getAllCloneUpdateRefs(node);

                deleteNodes.push(...linkedNodes);
            }
            const nodes: ClonableNode[] = [];

            deleteNodes.forEach((node) =>
            {
                nodes.push(...node.allChildren<ClonableNode>());
            });

            deleteNodes.push(...nodes);

            deleteNodes.sort(sortNode()).reverse();

            const deleteNodeIds = deleteNodes.map((node) => node.id);

            console.log('Delete ids:', deleteNodeIds);

            datastore.batch(() =>
            {
                deleteNodeIds.forEach((nodeId) => datastore.removeNode(nodeId));
            });
        }
    }

    public undo(): void
    {
        throw new Error('Method not implemented.');
    }
}
