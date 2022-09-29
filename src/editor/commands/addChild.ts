import type { ModelBase } from '../../core/model/model';
import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import { CloneMode } from '../../core/nodes/cloneInfo';
import { getInstance } from '../../core/nodes/instances';
import type { NodeSchema } from '../../core/nodes/schema';
import { AbstractCommand } from '../abstractCommand';
import { CloneCommand } from './clone';
import { CreateNodeCommand } from './createNode';
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

export class AddChildCommand<
    M extends ModelBase = ModelBase,
> extends AbstractCommand<AddChildCommandParams<M>, AddChildCommandReturn>
{
    public static commandName = 'CreateChild';

    public apply(): AddChildCommandReturn
    {
        const { params: { parentId, nodeSchema } } = this;

        const sourceNode = getInstance<ClonableNode>(parentId);
        const originalParentNode = sourceNode.getAddChildCloneTarget();
        const clonedParentNodes = originalParentNode.getAllCloned();

        const { node } = new CreateNodeCommand({ nodeSchema, isNewNode: true }).run();
        const nodes: ClonableNode[] = [node];
        let lastCloneSource = node;

        new SetParentCommand({ parentId: originalParentNode.id, nodeId: node.id }).run();

        clonedParentNodes.forEach((clonedParent) =>
        {
            const cloneMode = clonedParent.getNewChildCloneMode();

            const { clonedNode } = new CloneCommand({
                nodeId: lastCloneSource.id,
                cloneMode,
                depth: 1,
            }).run();

            if (cloneMode === CloneMode.Variant)
            {
                lastCloneSource = clonedNode;
            }

            nodes.push(clonedNode);

            new SetParentCommand({ parentId: clonedParent.id, nodeId: clonedNode.id }).run();
        });

        return { nodes };
    }

    public undo(): void
    {
        throw new Error('Method not implemented.');
    }
}
