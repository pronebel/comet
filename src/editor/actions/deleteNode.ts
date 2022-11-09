import { Application } from '../application';
import { RemoveChildCommand } from '../commands/removeChild';
import { Action } from '../core/action';

export type DeleteNodeOptions = {
    nodeId?: string;
};

export class DeleteNodeAction extends Action<DeleteNodeOptions, void>
{
    constructor()
    {
        super('deleteNode', {
            hotkey: 'backspace,delete,del',
        });
    }

    protected exec(options: DeleteNodeOptions): void
    {
        const app = Application.instance;
        const selectedNode = app.selection.lastNode;

        const nodeId = options.nodeId
            ?? (selectedNode ? selectedNode.id : undefined);

        if (nodeId)
        {
            app.undoStack.exec(new RemoveChildCommand({ nodeId }));
        }
    }
}
