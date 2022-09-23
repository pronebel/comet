import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import { getGraphNode } from '../../core/nodes/factory';
import { AbstractCommand } from '../baseCommand';

export interface SetParentCommandParams
{
    parentId: string;
    childId: string;
}
export class SetParentCommand extends AbstractCommand<SetParentCommandParams, ClonableNode>
{
    public static commandName = 'SetParent';

    public exec(): ClonableNode
    {
        const { datastore, params: { parentId, childId } } = this;

        datastore.setNodeParent(childId, parentId);

        const parentNode = getGraphNode(parentId);
        const childNode = getGraphNode(childId);

        parentNode.addChild(childNode);

        return parentNode;
    }

    public undo(): void
    {
        throw new Error('Method not implemented.');
    }
}
