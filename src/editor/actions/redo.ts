import { Application } from '../application';
import { Action } from '../core/action';
import { writeCommandList } from '../core/history';

export class RedoAction extends Action<void, void>
{
    constructor()
    {
        super('redo', {
            hotkey: 'Ctrl+Shift+Z',
        });
    }

    protected exec()
    {
        writeCommandList('redo');
        Application.instance.undoStack.redo();
    }
}
