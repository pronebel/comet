import type { ContainerNode } from '../../core/nodes/concrete/container';
import { Command } from '../core/command';

export interface AddSelectionCommandParams
{
    nodeId: string;
}

export class AddSelectionCommand
    extends Command<AddSelectionCommandParams>
{
    public static commandName = 'SetCustomProp';

    public apply(): void
    {
        const { app, params: { nodeId } } = this;

        const node = this.getInstance<ContainerNode>(nodeId);

        app.selection.add(node);
    }

    public undo(): void
    {
        const { app, params: { nodeId } } = this;

        const node = this.getInstance<ContainerNode>(nodeId);

        app.selection.remove(node);
    }
}
