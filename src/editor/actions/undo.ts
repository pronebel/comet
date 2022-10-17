import { Application } from '../application';
import { writeCommandList } from '../core/history';

export function undo()
{
    writeCommandList('undo');
    Application.instance.undoStack.undo();
}
