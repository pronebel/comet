import type { RealTimeObject } from '@convergence/convergence';

import type { ClonableNode } from '../../../core/lib/nodes/abstract/clonableNode';
import type { CloneMode } from '../../../core/lib/nodes/cloneInfo';
import { getGraphNode } from '../../../core/lib/nodes/factory';
import { getCloneInfoSchema, getNodeSchema } from '../sync/schema';
import { Command } from '.';

export class CloneCommand extends Command
{
    constructor(
        public readonly nodeId: string,
        public readonly cloneMode: CloneMode,
    )
    {
        super();
    }

    public name()
    {
        return 'Clone';
    }

    public apply(): void
    {
        const { nodeId, cloneMode, datastore } = this;

        const node = getGraphNode(nodeId);

        if (node)
        {
            const clone = node.clone(cloneMode);

            // update datastore with new cloned nodes

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

            // update datastore for all cloners (NOTE: do this after cloned nodes have been created)

            node.walk<ClonableNode>((node) =>
            {
                const cloneInfoSchema = getCloneInfoSchema(node);
                const nodeElement = datastore.getNodeElement(node.id);

                const cloneInfoElement = nodeElement.get('cloneInfo') as RealTimeObject;

                cloneInfoElement.value(cloneInfoSchema);
            });

            datastore.emit('datastoreNodeCloned', clone);
        }

        // todo: store nodeId for undo
    }

    public undo(): void
    {
        throw new Error('Method not implemented.');
    }
}
