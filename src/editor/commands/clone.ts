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
        const originalNode = sourceNode.cloneInfo.isVariant ? sourceNode : sourceNode.getOriginal();
        const cloneInfoSchema = getCloneInfoSchema(originalNode);

        // clone original
        const clonedNode = originalNode.clone(cloneMode, depth);

        // update originals new cloneInfo
        datastore.updateNodeCloneInfo(originalNode.id, cloneInfoSchema);

        // for each cloned node...
        clonedNode.walk<ClonableNode>((node) =>
        {
            const cloneInfoSchema = getCloneInfoSchema(node);
            const nodeSchema = {
                ...getNodeSchema(node),
                cloneInfo: cloneInfoSchema,
            };

            // create the datastore version of the cloned graph node
            datastore.createNodeSchema(nodeSchema);

            // register the graph node
            registerGraphNode(node);

            // update the cloners cloneInfo in the datastore
            const clonerId = cloneInfoSchema.cloner;

            if (clonerId)
            {
                const cloner = getGraphNode(clonerId);
                const cloneInfoSchema = getCloneInfoSchema(cloner);

                datastore.updateNodeCloneInfo(clonerId, cloneInfoSchema);
            }
        });

        // todo: need to parent correct cloned node to parent (and avoid bad child update bug)

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
