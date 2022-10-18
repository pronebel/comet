import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import type { CustomProperty } from '../../core/nodes/customProperties';
import { type UpdateMode, Command } from '../core/command';
import { SetCustomPropCommand } from './setCustomProp';
import { UnAssignCustomPropCommand } from './unassignCustomProp';

export interface RemoveCustomPropCommandParams
{
    nodeId: string;
    customKey: string;
    updateMode: UpdateMode;
}

export interface RemoveCustomPropCommandCache
{
    prop?: CustomProperty;
}

export class RemoveCustomPropCommand
    extends Command<RemoveCustomPropCommandParams, void, RemoveCustomPropCommandCache>
{
    public static commandName = 'RemoveCustomProp';

    public apply(): void
    {
        const { datastore, params: { nodeId, customKey, updateMode }, cache } = this;

        const node = this.getInstance(nodeId);

        if (updateMode === 'full')
        {
            // update datastore
            datastore.removeCustomProperty(nodeId, customKey);
        }

        // update cache
        cache.prop = node.getCustomProperty(customKey);

        // update graph node
        node.removeCustomProperty(customKey);

        // update node tree
        node.walk<ClonableNode>((node) =>
        {
            node.getAssignedModelKeys(customKey).forEach((modelKey) =>
            {
                new UnAssignCustomPropCommand({
                    nodeId: node.id,
                    modelKey,
                    updateMode,
                }).run();
            });
        });
    }

    public undo(): void
    {
        const { params: { nodeId, customKey, updateMode }, cache: { prop } } = this;

        if (prop)
        {
            new SetCustomPropCommand({ nodeId, customKey, type: prop.type, value: prop.value, updateMode }).run();
        }
        else
        {
            new RemoveCustomPropCommand({ nodeId, customKey, updateMode }).run();
        }
    }
}
