import type { RealTimeObject } from '@convergence/convergence';

import { Command } from '.';

export class AssignCustomPropCommand extends Command<{
    nodeId: string;
    modelKey: string;
    customKey: string;
}>
{
    public name = 'AssignCustomProp';

    public apply(): void
    {
        const { datastore, params: { nodeId, modelKey, customKey } } = this;

        const nodeElement = datastore.getNodeElement(nodeId);

        const assignedCustomProps = nodeElement.elementAt('customProperties', 'assigned') as RealTimeObject;

        assignedCustomProps.set(modelKey, customKey);

        datastore.emit('datastoreCustomPropAssigned', nodeId, modelKey, customKey);
    }

    public undo(): void
    {
        throw new Error('Method not implemented.');
    }
}
