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

    public name()
    {
        return 'CreateNode';
    }

    public apply(): NodeSchema<M>
    {
        const { nodeType, datastore, nodeOptions } = this;

        const nodeSchema = createNodeSchema<M>(nodeType, nodeOptions);

        // add data to datastore
        const nodeElement = datastore.nodes.set(nodeSchema.id, nodeSchema);

        // notify application, which will update object graph
        datastore.emit('dataStoreNodeCreated', nodeElement);

        return nodeSchema;
    }

    public undo(): void
    {
        throw new Error('Method not implemented.');
    }
}
