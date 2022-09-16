import type { ModelBase } from '../../../core/lib/model/model';
import { type NodeOptionsSchema, type NodeSchema, createNodeSchema } from '../sync/schema';
import { Command } from '.';

export class CreateNodeCommand<M extends ModelBase> extends Command<NodeSchema<M>>
{
    constructor(
        public readonly nodeType: string,
        public readonly nodeOptions: NodeOptionsSchema<M> = {},
    )
    {
        super();
    }

    public apply(): NodeSchema<M>
    {
        const { nodeType, datastore, nodeOptions } = this;

        const node = createNodeSchema<M>(nodeType, nodeOptions);

        // add data to datastore
        datastore.nodes.set(node.id, node);

        // trigger object graph update
        datastore.emit('nodeCreated', node);

        return node;
    }

    public undo(): void
    {
        throw new Error('Method not implemented.');
    }
}
