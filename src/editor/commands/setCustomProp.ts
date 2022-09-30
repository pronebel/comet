import type { RealTimeObject } from '@convergence/convergence';

import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import type { CustomProperty, CustomPropertyType, CustomPropertyValueType } from '../../core/nodes/customProperties';
import { getInstance } from '../../core/nodes/instances';
import { type UpdateMode, AbstractCommand } from '../abstractCommand';
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
    extends AbstractCommand<SetCustomPropCommandParams, void, SetCustomPropCommandCache>
{
    public static commandName = 'SetCustomProp';

    public apply(): void
    {
        const { datastore, params: { nodeId, customKey, type, value, updateMode }, cache } = this;

        const nodeElement = datastore.getNodeElement(nodeId);
        const definedCustomProps = nodeElement.elementAt('customProperties', 'defined') as RealTimeObject;

        if (updateMode === 'full')
        {
            // update datastore
            definedCustomProps.set(customKey, {
                type,
                value,
            });
        }

        const node = getInstance<ClonableNode>(nodeId);

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
