import { Command } from '.';

export class ModifyModelCommand extends Command
{
    constructor(
        public readonly targetId: string,
        public readonly key: string,
        public readonly value: any,
        public readonly oldValue: any,
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
