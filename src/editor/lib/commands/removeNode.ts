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

        // update datastore
        const nodeElement = datastore.getNode(nodeId);

        const parentId = nodeElement.get('parent').value() as string;

        datastore.nodes.remove(nodeId);
        datastore.unRegisterNode(nodeId);

        // trigger object graph update
        datastore.emit('datastoreNodeRemoved', nodeId, parentId);
    }

    public undo(): void
    {
        throw new Error('Method not implemented.');
    }
}
