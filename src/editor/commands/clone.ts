import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import { sortNodesByCreation } from '../../core/nodes/abstract/graphNode';
import type { CloneMode } from '../../core/nodes/cloneInfo';
import { getInstance, registerInstance } from '../../core/nodes/instances';
import { getCloneInfoSchema, getNodeSchema } from '../../core/nodes/schema';
import { type NodeTargetCommand, AbstractCommand } from '../abstractCommand';
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
    nodes: ClonableNode[];
}

export class CloneCommand
    extends AbstractCommand<CloneCommandParams, CloneCommandReturn, CloneCommandCache>
{
    public static commandName = 'Clone';

    public exec(): CloneCommandReturn
    {
        const { app, datastore, params: { nodeId, cloneMode, depth }, cache } = this;

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

        if (cache.nodes)
        {
            // adjust next command for new clone id
            const nextCommands = app.undoStack.nextRedoCommands.commands;

            for (const command of nextCommands)
            {
                if (command === this)
                {
                    continue;
                }

                (command as unknown as NodeTargetCommand).params.nodeId = clonedNode.id;
            }
        }

        // store cache
        clonedNodes.sort(sortNodesByCreation).reverse();
        cache.nodes = clonedNodes;

        return {
            sourceNode,
            clonedNode,
            originalNode,
        };
    }

    public undo(): void
    {
        const { cache: { nodes } } = this;

        for (const node of nodes)
        {
            new RemoveNodeCommand({ nodeId: node.id, updateMode: 'full' }).exec();
        }
    }
}
