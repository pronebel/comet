import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import { getGraphNode } from '../../core/nodes/nodeFactory';
import { AbstractCommand } from '../abstractCommand';

export interface SetParentCommandParams
{
    parentId: string;
    childId: string;
}

export interface SetParentCommandReturn
{
    parentNode: ClonableNode;
    childNode: ClonableNode;
}

export class SetParentCommand extends AbstractCommand<SetParentCommandParams, SetParentCommandReturn>
{
    public static commandName = 'SetParent';

    public exec(): SetParentCommandReturn
    {
        // update datastore
        const { datastore, params: { parentId, childId } } = this;

        datastore.setNodeParent(childId, parentId);

        // update graph node
        const parentNode = getGraphNode(parentId);
        const childNode = getGraphNode(childId);

        parentNode.addChild(childNode);

        return { parentNode, childNode };
    }

    public undo(): void
    {
        throw new Error('Method not implemented.');
    }
}
