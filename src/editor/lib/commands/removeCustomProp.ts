import type { RealTimeObject } from '@convergence/convergence';

import { Command } from '.';

export class RemoveCustomPropCommand extends Command<{
    nodeId: string;
    propName: string;
}>
{
    public static commandName = 'RemoveCustomProp';

    public apply(): void
    {
        const { datastore, params: { nodeId, propName } } = this;

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
