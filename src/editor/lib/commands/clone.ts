import type { RealTimeObject } from '@convergence/convergence';

import type { ClonableNode } from '../../../core/lib/nodes/abstract/clonableNode';
import type { CloneMode } from '../../../core/lib/nodes/cloneInfo';
import { getGraphNode } from '../../../core/lib/nodes/factory';
import { getCloneInfoSchema, getNodeSchema } from '../sync/schema';
import { Command } from '.';

export class CloneCommand extends Command<{
    nodeId: string;
    cloneMode: CloneMode;
}>
{
    public static commandName = 'Clone';

    public apply(): void
    {
        const { datastore, params: { nodeId, cloneMode } } = this;

        const node = getGraphNode(nodeId);

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
