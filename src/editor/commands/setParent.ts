import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import { getInstance } from '../../core/nodes/instances';
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

export interface SetParentCommandCache
{
    prevParentId?: string;
}

export class SetParentCommand
    extends AbstractCommand<SetParentCommandParams, SetParentCommandReturn, SetParentCommandCache>
{
    public static commandName = 'SetParent';

    public exec(): SetParentCommandReturn
    {
        const { datastore, params: { parentId, childId } } = this;

        const parentNode = getInstance<ClonableNode>(parentId);
        const childNode = getInstance<ClonableNode>(childId);

        // cache previous parent
        this.cache.prevParentId = childNode.parent?.id;

        // update datastore
        datastore.setNodeParent(childId, parentId);

        // update graph node
        parentNode.addChild(childNode);

        return { parentNode, childNode };
    }

    public undo(): void
    {
        const { cache: { prevParentId }, params: { childId } } = this;

        if (prevParentId)
        {
            new SetParentCommand({ parentId: prevParentId, childId }).exec();
        }
    }
}
