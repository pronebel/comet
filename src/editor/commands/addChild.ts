import type { ModelBase } from '../../core/model/model';
import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import { getGraphNode } from '../../core/nodes/nodeFactory';
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

    public get isStandAlone()
    {
        return true;
    }

    public exec(): AddChildCommandReturn
    {
        const { app, params: { parentId, nodeSchema } } = this;

        const sourceNode = getGraphNode(parentId);
        const originalParentNode = sourceNode.getAddChildCloneTarget();
        const clonedParentNodes = originalParentNode.getAllCloned();

        const { node } = app.exec<CreateNodeCommandReturn>(new CreateNodeCommand({ nodeSchema, isNewNode: true }));
        const nodes: ClonableNode[] = [node];

        app.exec(new SetParentCommand({ parentId: originalParentNode.id, childId: node.id }));

        clonedParentNodes.forEach((clonedParent) =>
        {
            const { clonedNode } = app.exec<CloneCommandReturn>(new CloneCommand({
                nodeId: node.id,
                cloneMode: clonedParent.getNewChildCloneMode(),
                depth: 1,
            }));

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
