import type { RealTimeObject } from '@convergence/convergence';

import { getGraphNode } from '../../core/nodes/nodeFactory';
import { AbstractCommand } from '../abstractCommand';

export interface AssignCustomPropCommandParams
{
    nodeId: string;
    modelKey: string;
    customKey: string;
}

export class AssignCustomPropCommand extends AbstractCommand<AssignCustomPropCommandParams>
{
    public static commandName = 'AssignCustomProp';

    public exec(): void
    {
        const { datastore, params: { nodeId, modelKey, customKey } } = this;

        const nodeElement = datastore.getNodeElement(nodeId);

        const assignedCustomProps = nodeElement.elementAt('customProperties', 'assigned') as RealTimeObject;

        assignedCustomProps.set(modelKey, customKey);

        // update graph node
        const node = getGraphNode(nodeId);

        node.assignCustomProperty(modelKey, customKey);
    }

    public undo(): void
    {
        throw new Error('Method not implemented.');
    }
}
