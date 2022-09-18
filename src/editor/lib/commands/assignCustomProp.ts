import { Command } from '.';

export class AssignCustomPropCommand extends Command
{
    constructor(
        public readonly nodeId: string,
        public readonly modelKey: string,
        public readonly customKey: string,
    )
    {
        super();
    }

    public name()
    {
        return 'AssignCustomProp';
    }

    public apply(): void
    {
        const { nodeId, modelKey, customKey, datastore } = this;

        datastore.assignNodeCustomProperty(nodeId, modelKey, customKey);
    }

    public undo(): void
    {
        throw new Error('Method not implemented.');
    }
}
