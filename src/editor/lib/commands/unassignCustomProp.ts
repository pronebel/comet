import { Command } from '.';

export class UnAssignCustomPropCommand extends Command
{
    constructor(
        public readonly nodeId: string,
        public readonly modelKey: string,
    )
    {
        super();
    }

    public name()
    {
        return 'UnAssignCustomProp';
    }

    public apply(): void
    {
        const { nodeId, modelKey, datastore } = this;

        datastore.unAssignNodeCustomProperty(nodeId, modelKey);
    }

    public undo(): void
    {
        throw new Error('Method not implemented.');
    }
}
