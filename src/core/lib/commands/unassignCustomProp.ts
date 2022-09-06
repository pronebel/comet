import { Command } from '.';

export class UnAssignCustomPropCommand extends Command
{
    constructor(
        public readonly targetId: string,
        public readonly modelKey: string,
    )
    {
        super();
    }

    public apply(): void
    {
        throw new Error('Method not implemented.');
    }

    public undo(): void
    {
        throw new Error('Method not implemented.');
    }
}
