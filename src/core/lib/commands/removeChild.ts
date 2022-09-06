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

    public apply(): void
    {
        throw new Error('Method not implemented.');
    }

    public undo(): void
    {
        throw new Error('Method not implemented.');
    }
}
