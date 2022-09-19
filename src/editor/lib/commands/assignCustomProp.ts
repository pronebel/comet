import type { RealTimeObject } from '@convergence/convergence';

import { Command } from '.';

export class AssignCustomPropCommand extends Command
{
    constructor(
        public readonly nodeId: string,
        public readonly modelKey: string,
        public readonly customKey: string,
    )
    {
        super();
    }

    public name()
    {
        return 'AssignCustomProp';
    }

    public apply(): void
    {
        const { nodeId, modelKey, customKey, datastore } = this;

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
