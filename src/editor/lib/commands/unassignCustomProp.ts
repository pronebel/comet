import type { RealTimeObject } from '@convergence/convergence';

import { Command } from '.';

export class UnAssignCustomPropCommand extends Command
{
    constructor(
        public readonly nodeId: string,
        public readonly modelKey: string,
    )
    {
        super();
    }

    public name()
    {
        return 'UnAssignCustomProp';
    }

    public apply(): void
    {
        const { nodeId, modelKey, datastore } = this;

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
