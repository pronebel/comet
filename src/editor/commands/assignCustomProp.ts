import type { RealTimeObject } from '@convergence/convergence';

import type { ModelValue } from '../../core/model/model';
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

        // update graph node
        const node = getGraphNode(nodeId);

        const customProp = node.assignCustomProperty(modelKey, customKey);

        if (customProp)
        {
            node.model.setValue(modelKey, customProp.value as ModelValue);

            const nodeElement = datastore.getNodeElement(nodeId);
            const assignedCustomProps = nodeElement.elementAt('customProperties', 'assigned') as RealTimeObject;

            // update datastore
            assignedCustomProps.set(modelKey, customProp.name);
        }
    }

    public undo(): void
    {
        throw new Error('Method not implemented.');
    }
}
