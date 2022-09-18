import type { CloneMode } from '../../../core/lib/nodes/cloneInfo';
import { Command } from '.';

export class CloneCommand extends Command
{
    constructor(
        public readonly nodeId: string,
        public readonly cloneMode: CloneMode,
    )
    {
        super();
    }

    public name()
    {
        return 'Clone';
    }

    public apply(): void
    {
        const { nodeId, cloneMode, datastore } = this;

        datastore.cloneNode(nodeId, cloneMode);

        // todo: store nodeId for undo
    }

    public undo(): void
    {
        throw new Error('Method not implemented.');
    }
}
