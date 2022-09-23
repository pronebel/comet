import type { ModelBase } from '../../core/model/model';
import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import { CloneMode } from '../../core/nodes/cloneInfo';
import { getGraphNode } from '../../core/nodes/factory';
import { type NodeSchema, getCloneInfoSchema } from '../../core/nodes/schema';
import { AbstractCommand } from '../abstractCommand';
import { type CloneCommandReturn, CloneCommand } from './clone';
import { type CreateNodeCommandReturn, CreateNodeCommand } from './createNode';
import { SetParentCommand } from './setParent';

export interface CreateChildCommandParams<M extends ModelBase>
{
    parentId: string;
    nodeSchema: NodeSchema<M>;
}

export interface CreateChildCommandReturn
{
    nodes: ClonableNode[];
}

export class CreateChildCommand<
    M extends ModelBase = ModelBase,
> extends AbstractCommand<CreateChildCommandParams<M>, CreateChildCommandReturn>
{
    public static commandName = 'CreateChild';

    public get isStandAlone()
    {
        return true;
    }

    public exec(): CreateChildCommandReturn
    {
        const { datastore, app, params: { parentId, nodeSchema } } = this;

        const originalParentNode = getGraphNode(parentId).getOriginal();
        const clonedNodes = originalParentNode.getAllCloned();

        const { node } = app.exec<CreateNodeCommandReturn>(new CreateNodeCommand({ nodeSchema }));
        const nodes: ClonableNode[] = [node];

        app.exec(new SetParentCommand({ parentId: originalParentNode.id, childId: node.id }));

        clonedNodes.forEach((clonedParent) =>
        {
            const cloneMode = clonedParent.getChildCloneMode();
            const { clonedNode } = app.exec<CloneCommandReturn>(new CloneCommand({
                nodeId: node.id,
                cloneMode,
            }));

            if (cloneMode === CloneMode.Reference && clonedNode.cloneInfo.isReferenceRoot)
            {
                clonedNode.cloneInfo.cloneMode = CloneMode.Reference;
                datastore.updateNodeCloneInfo(clonedNode.id, getCloneInfoSchema(clonedNode));
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
