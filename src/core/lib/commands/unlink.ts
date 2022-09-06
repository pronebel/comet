import { Command } from '.';

export class UnlinkCommand extends Command
{
    constructor(
        public readonly targetId: string,
        public readonly unlinkChildren: boolean,
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
