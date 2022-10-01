import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import { sortNodesByCreation } from '../../core/nodes/abstract/graphNode';
import { getInstance, newId } from '../../core/nodes/instances';
import { type NodeSchema, getNodeSchema } from '../../core/nodes/schema';
import { Command } from '../command';
import { CreateNodeCommand } from './createNode';
import { RemoveNodeCommand } from './removeNode';
import { SetParentCommand } from './setParent';

export interface RemoveChildCommandParams
{
    nodeId: string;
}

export interface RemoveChildCommandReturn
{
    nodes: ClonableNode[];
}

export interface RemoveChildCommandCache
{
    nodes: NodeSchema[];
}

export class RemoveChildCommand
    extends Command<RemoveChildCommandParams, RemoveChildCommandReturn, RemoveChildCommandCache>
{
    public static commandName = 'RemoveChild';

    public apply(): RemoveChildCommandReturn
    {
        const { cache, datastore, params: { nodeId }, hasRun } = this;

        const sourceNode = getInstance<ClonableNode>(nodeId);
        const originalNode = sourceNode.getModificationCloneTarget();
        const clonedNodes = originalNode.getClonedDescendants();

        const nodes: ClonableNode[] = [originalNode, ...clonedNodes];

        cache.nodes = [];

        nodes.forEach((rootNode) =>
        {
            rootNode.walk<ClonableNode>((node) => nodes.push(node), { includeSelf: false });
        });

        nodes.sort(sortNodesByCreation);

        if (!hasRun)
        {
            nodes.reverse();
        }

        datastore.batch(() =>
        {
            nodes.forEach((node) =>
            {
                const cloner = node.cloneInfo.cloner;

                // track in cache
                cache.nodes.push(getNodeSchema(node));

                new RemoveNodeCommand({ nodeId: node.id, updateMode: 'full' }).run();

                if (cloner)
                {
                    cloner.cloneInfo.removeCloned(node);
                }
            });
        });

        cache.nodes.reverse();

        return { nodes };
    }

    public undo(): void
    {
        const { cache: { nodes } } = this;

        nodes.forEach((nodeSchema) =>
        {
            const newNodeId = newId(nodeSchema.type);
            const oldNodeId = nodeSchema.id;
            const parentId = nodeSchema.parent as string;

            nodeSchema.id = newNodeId;

            const { node } = new CreateNodeCommand({ nodeSchema, isNewNode: true }).run();

            new SetParentCommand({ nodeId: node.id, parentId }).run();

            this.updateAllCommands((command) => command.updateNodeId(oldNodeId, newNodeId));
        });
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
