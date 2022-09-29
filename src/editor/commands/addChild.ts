import type { ModelBase } from '../../core/model/model';
import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import { CloneMode } from '../../core/nodes/cloneInfo';
import { getInstance } from '../../core/nodes/instances';
import type { NodeSchema } from '../../core/nodes/schema';
import { AbstractCommand } from '../abstractCommand';
import { type CloneCommandReturn, CloneCommand } from './clone';
import { type CreateNodeCommandReturn, CreateNodeCommand } from './createNode';
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

    public get isAtomic()
    {
        return false;
    }

    public exec(): AddChildCommandReturn
    {
        const { app, params: { parentId, nodeSchema } } = this;

        const sourceNode = getInstance<ClonableNode>(parentId);
        const originalParentNode = sourceNode.getAddChildCloneTarget();
        const clonedParentNodes = originalParentNode.getAllCloned();

        const { node } = app.execUndoRoot<CreateNodeCommandReturn>(new CreateNodeCommand({ nodeSchema, isNewNode: true }));
        const nodes: ClonableNode[] = [node];
        let lastCloneSource = node;

        app.exec(new SetParentCommand({ parentId: originalParentNode.id, childId: node.id }));

        clonedParentNodes.forEach((clonedParent) =>
        {
            const cloneMode = clonedParent.getNewChildCloneMode();

            const { clonedNode } = app.exec<CloneCommandReturn>(new CloneCommand({
                nodeId: lastCloneSource.id,
                cloneMode,
                depth: 1,
            }));

            if (cloneMode === CloneMode.Variant)
            {
                lastCloneSource = clonedNode;
            }

            nodes.push(clonedNode);

            app.exec(new SetParentCommand({ parentId: clonedParent.id, childId: clonedNode.id }));
        });

        return { nodes };
    }

    public undo(): void
    {
        throw new Error('Method not implemented.');
    }
}
