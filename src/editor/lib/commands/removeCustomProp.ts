import type { RealTimeObject } from '@convergence/convergence';

import { Command } from '.';

export class RemoveCustomPropCommand extends Command
{
    constructor(
        public readonly nodeId: string,
        public readonly propName: string,
    )
    {
        super();
    }

    public name()
    {
        return 'RemoveCustomProp';
    }

    public apply(): void
    {
        const { nodeId, propName, datastore } = this;

        const nodeElement = datastore.getNodeElement(nodeId);
        const definedCustomProps = nodeElement.elementAt('customProperties', 'defined') as RealTimeObject;

        definedCustomProps.remove(propName);

        datastore.emit('datastoreCustomPropUndefined', nodeId, propName);
    }

    public undo(): void
    {
        throw new Error('Method not implemented.');
    }
}
