import type { RealTimeObject } from '@convergence/convergence';

import { getGraphNode } from '../../core/nodes/nodeFactory';
import { AbstractCommand } from '../abstractCommand';

export interface UnAssignCustomPropCommandParams
{
    nodeId: string;
    modelKey: string;
}

export class UnAssignCustomPropCommand extends AbstractCommand<UnAssignCustomPropCommandParams>
{
    public static commandName = 'UnAssignCustomProp';

    public exec(): void
    {
        const { datastore, params: { nodeId, modelKey } } = this;

        // update graph node
        const node = getGraphNode(nodeId);

        const customKey = node.unAssignCustomProperty(modelKey);

        if (customKey)
        {
            // update model value
            node.model.clearValue(modelKey);

            // update datastore
            const nodeElement = datastore.getNodeElement(nodeId);
            const assignedCustomProps = nodeElement.elementAt('customProperties', 'assigned') as RealTimeObject;

            assignedCustomProps.remove(modelKey);
        }
    }

    public undo(): void
    {
        throw new Error('Method not implemented.');
    }
}
