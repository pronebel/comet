import { Application } from '../application';
import { writeCommandList } from '../core/history';

export function redo()
{
    writeCommandList('redo');
    Application.instance.undoStack.redo();
}
