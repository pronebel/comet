import type { RealTimeObject } from '@convergence/convergence';

import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import type { CloneMode } from '../../core/nodes/cloneInfo';
import { getGraphNode } from '../../core/nodes/factory';
import { getCloneInfoSchema, getNodeSchema } from '../../core/nodes/schema';
import { AbstractCommand } from '../command';

export interface CloneCommandParams
{
    nodeId: string;
    cloneMode: CloneMode;
}

export class CloneCommand extends AbstractCommand<CloneCommandParams>
{
    public static commandName = 'Clone';

    public exec(): void
    {
        const { datastore, params: { nodeId, cloneMode } } = this;

        const tempNode = getGraphNode(nodeId);
        const node = tempNode?.cloneInfo.isReferenceOrRoot
            ? tempNode?.getOriginal()
            : getGraphNode(nodeId);

        if (node)
        {
            const clone = node.clone(cloneMode);

            clone.walk<ClonableNode>((clonedNode) =>
            {
                const nodeSchema = getNodeSchema(clonedNode, true, false);

                const isClonedNode = clonedNode === clone;

                const cloner = clonedNode.cloneInfo.cloner;

                delete clonedNode.cloneInfo.cloner;

                datastore.createNode(nodeSchema, {
                    parent: isClonedNode ? node.parent?.id : undefined,
                }, clonedNode);

                clonedNode.cloneInfo.cloner = cloner;
            });

            // update this node and all children with new cloneInfo.cloned details

            node.walk<ClonableNode>((node) =>
            {
                const cloneInfoSchema = getCloneInfoSchema(node);
                const nodeElement = datastore.getNodeElement(node.id);

                const cloneInfoElement = nodeElement.get('cloneInfo') as RealTimeObject;

                cloneInfoElement.value(cloneInfoSchema);
            });

            datastore.emit('datastoreNodeCloned', clone);
        }
    }

    public undo(): void
    {
        throw new Error('Method not implemented.');
    }
}
