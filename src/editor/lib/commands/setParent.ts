import { Command } from '.';

export class SetParentCommand extends Command
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
        return 'SetParent';
    }

    public apply(): void
    {
        const { datastore, parentId, childId } = this;

        datastore.setNodeParent(parentId, childId);
    }

    public undo(): void
    {
        throw new Error('Method not implemented.');
    }
}
