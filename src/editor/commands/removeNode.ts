import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import { disposeGraphNode, getGraphNode } from '../../core/nodes/nodeFactory';
import { AbstractCommand } from '../abstractCommand';

export interface RemoveNodeCommandParams
{
    nodeId: string;
}

export interface RemoveNodeCommandReturn
{
    node: ClonableNode;
    parentNode: ClonableNode;
}

export class RemoveNodeCommand extends AbstractCommand<RemoveNodeCommandParams, RemoveNodeCommandReturn>
{
    public static commandName = 'RemoveNode';

    public exec(): RemoveNodeCommandReturn
    {
        const { datastore, params: { nodeId } } = this;

        const node = getGraphNode(nodeId);
        const parentNode = node.parent;

        if (!parentNode)
        {
            throw new Error(`Cannot remove node "${nodeId}" which has no parent`);
        }

        const parentId = parentNode.id;

        // delete data from datastore
        datastore.removeNode(nodeId, parentId);

        // remove from parent graph node
        parentNode.removeChild(node);

        // unregister graph node
        disposeGraphNode(node);

        return { node, parentNode: parentNode.cast<ClonableNode>() };
    }

    public undo(): void
    {
        throw new Error('Method not implemented.');
    }
}
