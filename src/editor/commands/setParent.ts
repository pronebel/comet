import { Command } from '.';

export class SetParentCommand extends Command<{
    parentId: string;
    childId: string;
}>
{
    public static commandName = 'SetParent';

    public apply(): void
    {
        const { datastore, params: { parentId, childId } } = this;

        const nodeElement = datastore.getNodeElement(childId);

        nodeElement.set('parent', parentId);

        datastore.emit('datastoreNodeSetParent', parentId, childId);
    }

    public undo(): void
    {
        throw new Error('Method not implemented.');
    }
}
