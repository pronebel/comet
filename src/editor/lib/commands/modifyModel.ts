import { Command } from '.';

export class ModifyModelCommand extends Command
{
    constructor(
        public readonly nodeId: string,
        public readonly key: string,
        public readonly value: any,
    )
    {
        super();
    }

    public name()
    {
        return 'ModifyModel';
    }

    public apply(): void
    {
        const { nodeId, key, value, datastore } = this;

        datastore.modifyModel(nodeId, key, value);
    }

    public undo(): void
    {
        throw new Error('Method not implemented.');
    }
}
