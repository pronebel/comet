import type { NodeSchema } from '../../core/nodes/schema';
import { AbstractCommand } from '../abstractCommand';

export interface RestoreNodeCommandParams
{
    nodeSchema: NodeSchema;
}

export class RestoreNodeCommand
    extends AbstractCommand<RestoreNodeCommandParams>
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
