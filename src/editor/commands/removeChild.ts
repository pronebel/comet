import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import { sortNodesByCreation } from '../../core/nodes/abstract/graphNode';
import { getInstance } from '../../core/nodes/instances';
import { Command } from '../command';
import { RemoveNodeCommand } from './removeNode';

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
    commands: RemoveNodeCommand[];
}

export class RemoveChildCommand
    extends Command<RemoveChildCommandParams, RemoveChildCommandReturn, RemoveChildCommandCache>
{
    public static commandName = 'RemoveChild';

    public apply(): RemoveChildCommandReturn
    {
        const { cache, datastore, params: { nodeId } } = this;

        const sourceNode = getInstance<ClonableNode>(nodeId);
        const originalNode = sourceNode.getModificationCloneTarget();
        const clonedNodes = originalNode.getClonedDescendants();

        const nodes: ClonableNode[] = [originalNode, ...clonedNodes];

        // prepare cache
        cache.commands = [];

        nodes.forEach((rootNode) =>
        {
            rootNode.walk<ClonableNode>((node) => nodes.push(node), { includeSelf: false });
        });

        nodes.sort(sortNodesByCreation).reverse();

        datastore.batch(() =>
        {
            nodes.forEach((node) =>
            {
                // track in cache
                const command = new RemoveNodeCommand({ nodeId: node.id, updateMode: 'full' });

                cache.commands.push(command);
                command.run();
            });
        });

        return { nodes };
    }

    public undo(): void
    {
        const { cache: { commands } } = this;

        for (let i = commands.length - 1; i >= 0; i--)
        {
            commands[i].undo();
        }
    }

    public assert(): void
    {
        this.app.assertNode(this.params.nodeId);
    }
}
