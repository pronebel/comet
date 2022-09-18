import { Command } from '.';

export class RemoveCustomPropCommand extends Command
{
    constructor(
        public readonly nodeId: string,
        public readonly propName: string,
    )
    {
        super();
    }

    public name()
    {
        return 'RemoveCustomProp';
    }

    public apply(): void
    {
        const { datastore, nodeId, propName } = this;

        datastore.removeNodeCustomProperty(nodeId, propName);
    }

    public undo(): void
    {
        throw new Error('Method not implemented.');
    }
}
