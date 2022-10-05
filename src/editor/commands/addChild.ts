import type { ModelBase } from '../../core/model/model';
import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import { CloneMode } from '../../core/nodes/cloneInfo';
import { getInstance } from '../../core/nodes/instances';
import type { NodeSchema } from '../../core/nodes/schema';
import { Command } from '../command';
import { CloneCommand } from './clone';
import { CreateNodeCommand } from './createNode';
import { RemoveChildCommand } from './removeChild';
import { SetParentCommand } from './setParent';

export interface AddChildCommandParams<M extends ModelBase>
{
    parentId: string;
    nodeSchema: NodeSchema<M>;
}

export interface AddChildCommandReturn
{
    nodes: ClonableNode[];
}

export interface AddChildCommandCache
{
    commands: RemoveChildCommand[];
}

export class AddChildCommand<
    M extends ModelBase = ModelBase,
> extends Command<AddChildCommandParams<M>, AddChildCommandReturn, AddChildCommandCache>
{
    public static commandName = 'AddChild';

    public apply(): AddChildCommandReturn
    {
        const { cache, params: { parentId, nodeSchema } } = this;

        const sourceNode = getInstance<ClonableNode>(parentId);
        const originalParentNode = sourceNode.getAddChildCloneTarget();
        const clonedParentNodes = originalParentNode.getClonedDescendants();

        const { node } = new CreateNodeCommand({ nodeSchema, isNewNode: true }).run();
        const nodes: ClonableNode[] = [node];

        let lastCloneSource = node;

        new SetParentCommand({ parentId: originalParentNode.id, nodeId: node.id }).run();
        // originalParentNode.addChild(node);

        clonedParentNodes.forEach((clonedParent) =>
        {
            const cloneMode = clonedParent.getNewChildCloneMode();

            const { clonedNode } = new CloneCommand({
                parentId: clonedParent.id,
                nodeId: lastCloneSource.id,
                cloneMode,
                depth: 1,
            }).run();

            if (cloneMode === CloneMode.Variant)
            {
                lastCloneSource = clonedNode;
            }

            nodes.push(clonedNode);
        });

        // prepare cache
        cache.commands = nodes.map((node) => new RemoveChildCommand({ nodeId: node.id }));

        return { nodes };
    }

    public undo(): void
    {
        const { cache: { commands } } = this;

        for (let i = commands.length - 1; i >= 0; i--)
        {
            commands[i].assert();
            commands[i].apply();
        }
    }

    public redo(): void
    {
        const { cache: { commands } } = this;

        for (let i = 0; i < commands.length; i++)
        {
            commands[i].assert();
            commands[i].undo();
        }
    }

    public assert(): void
    {
        this.app.assertNode(this.params.parentId);
        this.app.assertNode(this.params.nodeSchema.id);
    }
}
