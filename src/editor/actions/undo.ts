import { Application } from '../application';
import { Action } from '../core/action';
import { writeCommandList } from '../core/history';

export class UndoAction extends Action<void>
{
    constructor()
    {
        super('undo', {
            hotkey: 'Ctrl+Z',
        });
    }

    protected exec()
    {
        writeCommandList('undo');
        Application.instance.undoStack.undo();
    }
}
