import { Command } from '.';

export class RemoveChildCommand extends Command
{
    constructor(
        public readonly parentId: string,
        public readonly childId: string,
    )
    {
        super();
    }

    public name()
    {
        return 'RemoveChild';
    }

    public apply(): void
    {
        const { datastore, parentId, childId } = this;

        // add data to datastore
        datastore.hierarchy.set(parentId, childId);

        // trigger object graph update
        datastore.emit('dataStoreNodeChildAdded', parentId, childId);
    }

    public undo(): void
    {
        throw new Error('Method not implemented.');
    }
}
