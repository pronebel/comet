import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import type { CloneMode } from '../../core/nodes/cloneInfo';
import { getGraphNode, registerGraphNode } from '../../core/nodes/factory';
import { getCloneInfoSchema, getNodeSchema } from '../../core/nodes/schema';
import { AbstractCommand } from '../baseCommand';
import { SetParentCommand } from './setParent';

export interface CloneCommandParams
{
    nodeId: string;
    cloneMode: CloneMode;
}

export class CloneCommand extends AbstractCommand<CloneCommandParams>
{
    public static commandName = 'Clone';

    public exec(): ClonableNode
    {
        const { datastore, params: { nodeId, cloneMode } } = this;

        const node = getGraphNode(nodeId);
        const parentNode = node.parent;

        const original = node.getOriginal();

        const clone = original.clone(cloneMode);

        const cloneInfoSchema = getCloneInfoSchema(original);

        datastore.updateNodeCloneInfo(original.id, cloneInfoSchema);

        clone.walk<ClonableNode>((clonedNode) =>
        {
            const cloneInfoSchema = getCloneInfoSchema(clonedNode);
            const nodeSchema = {
                ...getNodeSchema(clonedNode),
                cloneInfo: cloneInfoSchema,
            };

            datastore.createNodeSchema(nodeSchema);

            registerGraphNode(clonedNode);
        });

        if (parentNode)
        {
            this.app.exec(new SetParentCommand({ parentId: parentNode.id, childId: clone.id }));
        }

        return clone;
    }

    public undo(): void
    {
        throw new Error('Method not implemented.');
    }
}
