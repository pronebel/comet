import type { RealTimeObject } from '@convergence/convergence';

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
