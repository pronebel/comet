import type { NodeOptions } from '../../../core/lib/nodes/abstract/clonableNode';
import { createNode } from '../sync/schema';
import { Command } from '.';

export class CreateNodeCommand extends Command
{
    constructor(
        public readonly nodeType: string,
        public readonly nodeOptions: NodeOptions<any>,
    )
    {
        super();
    }

    public apply(): void
    {
        const { nodeType, nodeOptions, datastore } = this;

        const node = createNode(nodeType, nodeOptions.id);

        datastore.nodes.set(node.id, node);

        datastore.emit('nodeCreated', node);
    }

    public undo(): void
    {
        throw new Error('Method not implemented.');
    }
}
