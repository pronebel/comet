import type { CloneMode } from '../node/cloneInfo';
import { Command } from '.';

export class CloneCommand extends Command
{
    constructor(
        public readonly clonerId: string,
        public readonly clonedId: string,
        public readonly cloneMode: CloneMode,
        public readonly depth: number,
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
