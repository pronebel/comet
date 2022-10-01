import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import type { CloneMode } from '../../core/nodes/cloneInfo';
import { getInstance, registerInstance } from '../../core/nodes/instances';
import { type NodeSchema, getCloneInfoSchema, getNodeSchema } from '../../core/nodes/schema';
import { Command } from '../command';
import { RemoveNodeCommand } from './removeNode';

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

export interface CloneCommandCache
{
    nodes: NodeSchema[];
}

export class CloneCommand
    extends Command<CloneCommandParams, CloneCommandReturn, CloneCommandCache>
{
    public static commandName = 'Clone';

    public apply(): CloneCommandReturn
    {
        const { datastore, params: { nodeId, cloneMode, depth }, cache, hasRun } = this;

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

        if (hasRun)
        {
            // adjust next command for new clone ids
            for (let i = 0; i < clonedNodes.length; i++)
            {
                const oldNodeId = cache.nodes[i].id;
                const newNodeId = clonedNodes[i].id;

                this.updateAllCommands((command) => command.updateNodeId(oldNodeId, newNodeId));
            }
        }

        // store cache
        cache.nodes = clonedNodes.map((node) => getNodeSchema(node));

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

    public updateNodeId(oldNodeId: string, newNodeId: string): void
    {
        super.updateNodeId(oldNodeId, newNodeId);

        this.cache.nodes.forEach((nodeSchema) =>
        {
            this.updateNodeSchemaId(nodeSchema, oldNodeId, newNodeId);
        });
    }
}
