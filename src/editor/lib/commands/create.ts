import type { NodeOptions } from '../../../core/lib/nodes/abstract/clonableNode';
import { createNode } from '../sync/schema';
import { Command } from '.';

export class CreateNodeCommand extends Command
{
    constructor(
        public readonly nodeType: string,
        public readonly nodeOptions: NodeOptions<any> = {},
    )
    {
        super();
    }

    public apply(): void
    {
        const { nodeType, datastore, nodeOptions } = this;

        const node = createNode(nodeType, nodeOptions.id);

        // add data to datastore
        datastore.nodes.set(node.id, node);

        // trigger object graph update
        datastore.emit('nodeCreated', node);
    }

    public undo(): void
    {
        throw new Error('Method not implemented.');
    }
}
