import { Command } from '.';

export class RemoveCustomPropCommand extends Command
{
    constructor(
        public readonly targetId: string,
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
