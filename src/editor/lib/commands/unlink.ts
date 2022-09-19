import { Command } from '.';

export class UnlinkCommand extends Command
{
    constructor(
        public readonly nodeId: string,
    )
    {
        super();
    }

    public name()
    {
        return 'Unlink';
    }

    public apply(): void
    {
        const { nodeId, datastore } = this;

        datastore.unlink(nodeId);
    }

    public undo(): void
    {
        throw new Error('Method not implemented.');
    }
}
