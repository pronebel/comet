import type { ModelValue } from '../../core/model/model';
import { type UpdateMode, Command } from '../core/command';
import { UnAssignCustomPropCommand } from './unassignCustomProp';

export interface AssignCustomPropCommandParams
{
    nodeId: string;
    modelKey: string;
    customKey: string;
    updateMode: UpdateMode;
}

export interface AssignCustomPropCommandCache
{
    customKey?: string;
}

export class AssignCustomPropCommand
    extends Command<AssignCustomPropCommandParams, void, AssignCustomPropCommandCache>
{
    public static commandName = 'AssignCustomProp';

    public apply(): void
    {
        const { datastore, params: { nodeId, modelKey, customKey, updateMode }, cache } = this;

        // update graph node
        const node = this.getInstance(nodeId);

        const { prop, oldCustomKey } = node.assignCustomProperty(modelKey, customKey);

        cache.customKey = oldCustomKey;

        if (prop)
        {
            // update model value
            node.model.setValue(modelKey, prop.value as ModelValue);

            if (updateMode === 'full')
            {
                // update datastore
                datastore.assignCustomProperty(nodeId, modelKey, customKey);
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
        else
        {
            new UnAssignCustomPropCommand({ nodeId, modelKey, updateMode }).run();
        }
    }
}
