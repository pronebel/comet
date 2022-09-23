import type { RealTimeObject } from '@convergence/convergence';

import { AbstractCommand } from '../command';

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

        datastore.emit('datastoreCustomPropAssigned', nodeId, modelKey, customKey);
    }

    public undo(): void
    {
        throw new Error('Method not implemented.');
    }
}
