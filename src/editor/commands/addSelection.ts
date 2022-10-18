import type { ContainerNode } from '../../core/nodes/concrete/container';
import { Command } from '../core/command';
import type { EditableView } from '../ui/editableView';

export interface AddSelectionCommandParams
{
    nodeId: string;
    view: EditableView;
}

export class AddSelectionCommand
    extends Command<AddSelectionCommandParams>
{
    public static commandName = 'SetCustomProp';

    public apply(): void
    {
        const { params: { nodeId, view } } = this;

        const node = this.getInstance<ContainerNode>(nodeId);

        view.selection.add(node);
    }

    public undo(): void
    {
        const { params: { nodeId, view } } = this;

        const node = this.getInstance<ContainerNode>(nodeId);

        view.selection.remove(node);
    }
}
