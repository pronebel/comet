import type { ClonableNode } from '../../../core/lib/nodes/abstract/clonableNode';
import { sortNodesByCreation } from '../../../core/lib/nodes/abstract/graphNode';
import { getGraphNode } from '../../../core/lib/nodes/factory';
import type { NodeSchema } from '../sync/schema';
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
            const deleteNodes: ClonableNode[] = [node];
            const { isCloned, hasCloned, isReferenceRoot } = node.cloneInfo;

            if ((isCloned || hasCloned) && !isReferenceRoot)
            {
                const linkedNodes = node.getAllCloneRefNodes();

                deleteNodes.push(...linkedNodes);
            }

            const nodes: ClonableNode[] = [];

            deleteNodes.forEach((node) =>
            {
                nodes.push(...node.allChildren<ClonableNode>());
            });

            deleteNodes.push(...nodes);

            (deleteNodes as unknown as NodeSchema[]).sort(sortNodesByCreation).reverse();

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
