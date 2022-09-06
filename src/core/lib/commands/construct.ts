import type { CloneMode } from '../clone';
import { Command } from '.';

export class ConstructCommand extends Command
{
    constructor(
        public readonly targetId: string,
        public readonly componentType: string,
        public readonly modelValues: object,
        public readonly cloneMode: CloneMode,
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
