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

    public isReferencingNode(nodeId: string): boolean
    {
        if (super.isReferencingNode(nodeId))
        {
            return true;
        }

        if (!this.datastore.hasNodeElement(nodeId))
        {
            return false;
        }

        const nodeSchema = this.datastore.getNodeElementSchema(nodeId);

        if (nodeSchema.prevId)
        {
            return super.isReferencingNode(nodeSchema.prevId);
        }

        return false;
    }
}
