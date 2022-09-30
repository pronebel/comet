import type { RealTimeObject } from '@convergence/convergence';

import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import type { CustomProperty } from '../../core/nodes/customProperties';
import { getInstance } from '../../core/nodes/instances';
import { type UpdateMode, AbstractCommand } from '../abstractCommand';
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
    extends AbstractCommand<RemoveCustomPropCommandParams, void, RemoveCustomPropCommandCache>
{
    public static commandName = 'RemoveCustomProp';

    public apply(): void
    {
        const { datastore, params: { nodeId, customKey, updateMode }, cache } = this;

        if (updateMode === 'full')
        {
            // update datastore
            const nodeElement = datastore.getNodeElement(nodeId);
            const definedCustomProps = nodeElement.elementAt('customProperties', 'defined') as RealTimeObject;

            definedCustomProps.remove(customKey);
        }

        const node = getInstance<ClonableNode>(nodeId);

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
