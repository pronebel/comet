import type { RealTimeObject } from '@convergence/convergence';

import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import { getInstance } from '../../core/nodes/instances';
import { type UpdateMode, Command } from '../command';
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

    public apply(): void
    {
        const { datastore, params: { nodeId, modelKey, updateMode }, cache } = this;

        // update graph node
        const node = getInstance<ClonableNode>(nodeId);

        cache.customKey = node.getAssignedCustomProperty(modelKey);

        const customKey = node.unAssignCustomProperty(modelKey);

        if (customKey)
        {
            // update model value
            node.model.clearValue(modelKey);

            if (updateMode === 'full')
            {
                // update datastore
                const nodeElement = datastore.getNodeElement(nodeId);
                const assignedCustomProps = nodeElement.elementAt('customProperties', 'assigned') as RealTimeObject;

                assignedCustomProps.remove(modelKey);
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
