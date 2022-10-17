import { Application } from '../application';
import { writeCommandList } from '../core/history';

export function undo()
{
    writeCommandList('redo');
    Application.instance.undoStack.redo();
}
