import { Command } from '.';

export class AssignCustomPropCommand extends Command
{
    constructor(
        public readonly targetId: string,
        public readonly modelKey: string,
        public readonly customKey: string,
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
