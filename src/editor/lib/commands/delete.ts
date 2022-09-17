import { Command } from '.';

export class DeleteCommand extends Command
{
    constructor(
        public readonly nodeId: string,
    )
    {
        super();
    }

    public name(): string
    {
        return 'Delete';
    }

    public apply(): void
    {
        const { datastore, nodeId } = this;

        datastore.nodes.remove(nodeId);
        datastore.unRegisterNodeRealtimeObject(nodeId);

        datastore.emit('dataStoreNodeDeleted', nodeId);
    }

    public undo(): void
    {
        throw new Error('Method not implemented.');
    }
}
