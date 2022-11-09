import type { DisplayObjectNode } from '../../core/nodes/abstract/displayObject';

export interface SelectionEvent
{
    'selection.set': DisplayObjectNode;
    'selection.add': DisplayObjectNode;
    'selection.remove': DisplayObjectNode;
    'selection.deselect': void[];
}
