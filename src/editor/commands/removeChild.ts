import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import { sortNodesByCreation } from '../../core/nodes/abstract/graphNode';
import { getInstance } from '../../core/nodes/instances';
import { AbstractCommand } from '../abstractCommand';
import { RemoveNodeCommand } from './removeNode';

export interface RemoveChildCommandParams
{
    nodeId: string;
}

export interface RemoveChildCommandReturn
{
    nodes: ClonableNode[];
}

export class RemoveChildCommand extends AbstractCommand<RemoveChildCommandParams, RemoveChildCommandReturn>
{
    public static commandName = 'RemoveChild';

    public get isAtomic()
    {
        return false;
    }

    public apply(): RemoveChildCommandReturn
    {
        const { app, datastore, params: { nodeId } } = this;

        const sourceNode = getInstance<ClonableNode>(nodeId);
        const originalNode = sourceNode.getModificationCloneTarget();
        const clonedNodes = originalNode.getAllCloned();

        const nodes: ClonableNode[] = [originalNode, ...clonedNodes];

        nodes.forEach((rootNode) =>
        {
            rootNode.walk<ClonableNode>((node) => nodes.push(node), { includeSelf: false });
        });

        nodes.sort(sortNodesByCreation).reverse();

        datastore.batch(() =>
        {
            nodes.forEach((node) =>
            {
                const cloner = node.cloneInfo.cloner;

                app.execUndoRoot(new RemoveNodeCommand({ nodeId: node.id, updateMode: 'full' }));

                if (cloner)
                {
                    cloner.cloneInfo.removeCloned(node);
                }
            });
        });

        return { nodes };
    }

    public undo(): void
    {
        throw new Error('Method not implemented.');
    }
}
