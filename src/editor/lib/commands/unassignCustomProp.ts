import type { RealTimeObject } from '@convergence/convergence';

import { Command } from '.';

export class UnAssignCustomPropCommand extends Command<{
    nodeId: string;
    modelKey: string;
}>
{
    public name = 'UnAssignCustomProp';

    public apply(): void
    {
        const { datastore, params: { nodeId, modelKey } } = this;

        const nodeElement = datastore.getNodeElement(nodeId);

        const assignedCustomProps = nodeElement.elementAt('customProperties', 'assigned') as RealTimeObject;

        assignedCustomProps.remove(modelKey);

        datastore.emit('datastoreCustomPropUnAssigned', nodeId, modelKey);
    }

    public undo(): void
    {
        throw new Error('Method not implemented.');
    }
}
