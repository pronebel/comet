import type { NodeSchema } from '../../core/nodes/schema';
import { Command } from '../command';

export interface RestoreNodeCommandParams
{
    nodeSchema: NodeSchema;
}

export class RestoreNodeCommand
    extends Command<RestoreNodeCommandParams>
{
    public static commandName = 'RestoreNode';

    public apply()
    {
        //
    }

    public undo(): void
    {
        const { datastore, params: { nodeSchema } } = this;

        datastore.restoreRemovedNode(nodeSchema.id);
    }
}
