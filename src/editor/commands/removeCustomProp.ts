import type { RealTimeObject } from '@convergence/convergence';

import { AbstractCommand } from '../command';

export interface RemoveCustomPropCommandParams
{
    nodeId: string;
    propName: string;
}

export class RemoveCustomPropCommand extends AbstractCommand<RemoveCustomPropCommandParams>
{
    public static commandName = 'RemoveCustomProp';

    public exec(): void
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
