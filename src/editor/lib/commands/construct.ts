import type { CloneMode } from '../../../core/lib/nodes/cloneInfo';
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
        // throw new Error('Method not implemented.');
        // todo: get document model and add new node...detect updates on other side
    }

    public undo(): void
    {
        throw new Error('Method not implemented.');
    }
}
