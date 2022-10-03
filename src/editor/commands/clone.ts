import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import type { CloneMode } from '../../core/nodes/cloneInfo';
import { getInstance, registerInstance } from '../../core/nodes/instances';
import { getCloneInfoSchema, getNodeSchema } from '../../core/nodes/schema';
import { Command } from '../command';
import { RemoveNodeCommand } from './removeNode';
import { SetParentCommand } from './setParent';

export interface CloneCommandParams
{
    parentId?: string;
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

export interface CloneCommandCache
{
    nodes: ClonableNode[];
}

export class CloneCommand
    extends Command<CloneCommandParams, CloneCommandReturn, CloneCommandCache>
{
    public static commandName = 'Clone';

    public apply(): CloneCommandReturn
    {
        const { datastore, params: { nodeId, cloneMode, depth, parentId }, cache } = this;

        const sourceNode = getInstance<ClonableNode>(nodeId);
        const originalNode = sourceNode.getCloneTarget();
        const cloneInfoSchema = getCloneInfoSchema(originalNode);

        const clonedNodes: ClonableNode[] = [];

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
            datastore.createNode(nodeSchema);

            // update parenting info in datastore to trigger remote users
            if (node.parent)
            {
                datastore.setNodeParent(node.id, node.parent.id, false);
            }

            // register the graph node
            registerInstance(node);

            // update the cloners cloneInfo in the datastore
            const clonerId = nodeSchema.cloneInfo.cloner;

            if (clonerId)
            {
                const cloner = getInstance<ClonableNode>(clonerId);
                const cloneInfoSchema = getCloneInfoSchema(cloner);

                datastore.updateNodeCloneInfo(clonerId, cloneInfoSchema);
            }

            // track for cache
            clonedNodes.push(node);
        });

        // store cache
        cache.nodes = clonedNodes;

        // set parent if provided
        if (parentId)
        {
            new SetParentCommand({ parentId, nodeId: clonedNode.id }).run();
        }

        return {
            sourceNode,
            clonedNode,
            originalNode,
        };
    }

    public undo(): void
    {
        const { cache: { nodes } } = this;

        for (let i = nodes.length - 1; i >= 0; i--)
        {
            const node = nodes[i];

            new RemoveNodeCommand({ nodeId: node.id, updateMode: 'full' }).run();
        }
    }

    public redo()
    {
        const { cache: { nodes }, datastore } = this;

        for (let i = 0; i < nodes.length; i++)
        {
            const node = nodes[i];

            datastore.restoreNode(node.id);
        }
    }
}
