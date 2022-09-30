import type { RealTimeObject } from '@convergence/convergence';

import type { ModelValue } from '../../core/model/model';
import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import { getInstance } from '../../core/nodes/instances';
import { type UpdateMode, AbstractCommand } from '../abstractCommand';
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
    extends AbstractCommand<AssignCustomPropCommandParams, void, AssignCustomPropCommandCache>
{
    public static commandName = 'AssignCustomProp';

    public apply(): void
    {
        const { datastore, params: { nodeId, modelKey, customKey, updateMode }, cache } = this;

        // update graph node
        const node = getInstance<ClonableNode>(nodeId);

        const { prop, oldCustomKey } = node.assignCustomProperty(modelKey, customKey);

        cache.customKey = oldCustomKey;

        if (prop)
        {
            // update model value
            node.model.setValue(modelKey, prop.value as ModelValue);

            if (updateMode === 'full')
            {
                // update datastore
                const nodeElement = datastore.getNodeElement(nodeId);
                const assignedCustomProps = nodeElement.elementAt('customProperties', 'assigned') as RealTimeObject;

                assignedCustomProps.set(modelKey, customKey);
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
