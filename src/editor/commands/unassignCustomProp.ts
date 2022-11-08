import { type UpdateMode, Command } from '../core/command';
import { AssignCustomPropCommand } from './assignCustomProp';

export interface UnAssignCustomPropCommandParams
{
    nodeId: string;
    modelKey: string;
    updateMode: UpdateMode;
}

export interface UnAssignCustomPropCommandCache
{
    customKey?: string;
}

export class UnAssignCustomPropCommand
    extends Command<UnAssignCustomPropCommandParams, void, UnAssignCustomPropCommandCache>
{
    public static commandName = 'UnAssignCustomProp';

    public get targetNodeId()
    {
        return this.params.nodeId;
    }

    public apply(): void
    {
        const { datastore, params: { nodeId, modelKey, updateMode }, cache } = this;

        // update graph node
        const node = this.getInstance(nodeId);

        cache.customKey = node.getAssignedCustomProperty(modelKey);

        const customKey = node.unAssignCustomProperty(modelKey);

        if (customKey)
        {
            // update model value
            node.model.clearValue(modelKey);

            if (updateMode === 'full')
            {
                // update datastore
                datastore.unassignCustomProperty(nodeId, modelKey);
            }
        }
    }

    public undo(): void
    {
        const { params: { nodeId, modelKey, updateMode }, cache: { customKey } } = this;

        if (customKey)
        {
            new AssignCustomPropCommand({ nodeId, customKey, modelKey, updateMode }).run();
        }
    }
}
