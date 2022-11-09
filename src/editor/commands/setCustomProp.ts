import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import type { CustomProperty, CustomPropertyType, CustomPropertyValueType } from '../../core/nodes/customProperties';
import { type UpdateMode, Command } from '../core/command';
import { AssignCustomPropCommand } from './assignCustomProp';
import { RemoveCustomPropCommand } from './removeCustomProp';

export interface SetCustomPropCommandParams
{
    nodeId: string;
    customKey: string;
    type: CustomPropertyType;
    value: CustomPropertyValueType | undefined;
    updateMode: UpdateMode;
}

export interface SetCustomPropCommandCache
{
    prop?: CustomProperty;
}

export class SetCustomPropCommand
    extends Command<SetCustomPropCommandParams, void, SetCustomPropCommandCache>
{
    public static commandName = 'SetCustomProp';

    public apply(): void
    {
        const { datastore, params: { nodeId, customKey, type, value, updateMode }, cache } = this;
        const node = this.getInstance(nodeId);

        if (updateMode === 'full')
        {
            // update datastore
            datastore.setCustomProperty(nodeId, customKey, type, value);
        }

        // update cache
        const prevProp = node.getCustomProperty(customKey);

        if (prevProp)
        {
            cache.prop = { ...prevProp };
        }

        // update graph node
        node.setCustomProperty(customKey, type, value);

        // update node tree
        node.walk<ClonableNode>((node) =>
        {
            node.getAssignedModelKeys(customKey).forEach((modelKey) =>
            {
                new AssignCustomPropCommand({
                    nodeId: node.id,
                    customKey,
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
