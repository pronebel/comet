import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import type { CloneMode } from '../../core/nodes/cloneInfo';
import { getGraphNode, registerGraphNode } from '../../core/nodes/nodeFactory';
import { getCloneInfoSchema, getNodeSchema } from '../../core/nodes/schema';
import { AbstractCommand } from '../abstractCommand';

export interface CloneCommandParams
{
    nodeId: string;
    cloneMode: CloneMode;
    depth?: number;
}

export interface CloneCommandReturn
{
    sourceNode: ClonableNode;
    clonedNode: ClonableNode;
    originalNode: ClonableNode;
}

export class CloneCommand extends AbstractCommand<CloneCommandParams, CloneCommandReturn>
{
    public static commandName = 'Clone';

    public exec(): CloneCommandReturn
    {
        const { datastore, params: { nodeId, cloneMode, depth } } = this;

        const sourceNode = getGraphNode(nodeId);
        const originalNode = sourceNode.getCloneTarget();
        const cloneInfoSchema = getCloneInfoSchema(originalNode);

        // clone original
        const clonedNode = originalNode.clone(cloneMode, depth);

        // update originals new cloneInfo
        datastore.updateNodeCloneInfo(originalNode.id, cloneInfoSchema);

        // for each cloned node (including primary cloned node)...
        clonedNode.walk<ClonableNode>((node) =>
        {
            const nodeSchema = {
                ...getNodeSchema(node),
                cloneInfo: getCloneInfoSchema(node),
            };

            // create the datastore version of the cloned graph node
            datastore.createNodeSchema(nodeSchema);

            // update parenting info in datastore to trigger remote users
            if (node.parent)
            {
                datastore.setNodeParent(node.id, node.parent.id, false);
            }

            // register the graph node
            registerGraphNode(node);

            // update the cloners cloneInfo in the datastore
            const clonerId = nodeSchema.cloneInfo.cloner;

            if (clonerId)
            {
                const cloner = getGraphNode(clonerId);
                const cloneInfoSchema = getCloneInfoSchema(cloner);

                datastore.updateNodeCloneInfo(clonerId, cloneInfoSchema);
            }
        });

        return {
            sourceNode,
            clonedNode,
            originalNode,
        };
    }

    public undo(): void
    {
        throw new Error('Method not implemented.');
    }
}
