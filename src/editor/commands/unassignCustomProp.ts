import type { RealTimeObject } from '@convergence/convergence';

import { getGraphNode } from '../../core/nodes/nodeFactory';
import { type UpdateMode, AbstractCommand } from '../abstractCommand';

export interface UnAssignCustomPropCommandParams
{
    nodeId: string;
    modelKey: string;
    updateMode: UpdateMode;
}

export class UnAssignCustomPropCommand extends AbstractCommand<UnAssignCustomPropCommandParams>
{
    public static commandName = 'UnAssignCustomProp';

    public exec(): void
    {
        const { datastore, params: { nodeId, modelKey, updateMode } } = this;

        // update graph node
        const node = getGraphNode(nodeId);

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
        throw new Error('Method not implemented.');
    }
}
