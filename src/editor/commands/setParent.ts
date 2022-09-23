import { AbstractCommand } from '../baseCommand';

export interface SetParentCommandParams
{
    parentId: string;
    childId: string;
}
export class SetParentCommand extends AbstractCommand<SetParentCommandParams>
{
    public static commandName = 'SetParent';

    public exec(): void
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
