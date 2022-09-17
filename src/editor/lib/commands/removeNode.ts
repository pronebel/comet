import { Command } from '.';

export class RemoveNodeCommand extends Command
{
    constructor(
        public readonly nodeId: string,
    )
    {
        super();
    }

    public name()
    {
        return 'RemoveNode';
    }

    public apply(): void
    {
        const { datastore, nodeId } = this;

        datastore.removeNode(nodeId);
    }

    public undo(): void
    {
        throw new Error('Method not implemented.');
    }
}
