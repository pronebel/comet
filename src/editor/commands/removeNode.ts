import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import { sortNodesByCreation } from '../../core/nodes/abstract/graphNode';
import { getGraphNode } from '../../core/nodes/factory';
import { AbstractCommand } from '../abstractCommand';

export interface RemoveNodeCommandParams
{
    nodeId: string;
}

export class RemoveNodeCommand extends AbstractCommand<RemoveNodeCommandParams>
{
    public static commandName = 'RemoveNode';

    public exec(): void
    {
        const { datastore, params: { nodeId } } = this;

        const node = getGraphNode(nodeId);

        const deleteNodes: ClonableNode[] = [];
        const { isOriginal, hasCloned, isReferenceRoot, isVariant } = node.cloneInfo;

        if (((isOriginal || isVariant) && !hasCloned))
        {
            // original or variant which wasn't cloned
            deleteNodes.push(...node.getAllChildren<ClonableNode>(true));
        }
        else if (isReferenceRoot)
        {
            // node has been cloned, will need to delete all cloned nodes
            const nodes = node.getAllCloned();

            deleteNodes.push(node);

            nodes.forEach((node) => deleteNodes.push(...node.getAllChildren<ClonableNode>(true)));
        }
        else
        {
            // node has been cloned, will need to delete all cloned nodes
            const original = node.getOriginal();
            const nodes = original.getAllCloned();

            deleteNodes.push(original);

            nodes.forEach((node) => deleteNodes.push(...node.getAllChildren<ClonableNode>(true)));
        }

        deleteNodes.sort(sortNodesByCreation).reverse();

        const deleteNodeIds = deleteNodes.map((node) => node.id);

        console.log('Delete ids:', deleteNodeIds);

        datastore.batch(() =>
        {
            deleteNodeIds.forEach((nodeId) => datastore.removeNode(nodeId));
        });
    }

    public undo(): void
    {
        throw new Error('Method not implemented.');
    }
}
