import type { RealTimeObject } from '@convergence/convergence';

import { Command } from '.';

export class ModifyModelCommand extends Command<{
    nodeId: string;
    key: string;
    value: any;
}>
{
    public name = 'ModifyModel';

    public apply(): void
    {
        const { datastore, params: { nodeId, key, value } } = this;

        const nodeElement = datastore.getNodeElement(nodeId);

        const model = nodeElement.get('model') as RealTimeObject;

        model.set(key, value);

        datastore.emit('datastoreModelModified', nodeId, key, value);
    }

    public undo(): void
    {
        throw new Error('Method not implemented.');
    }
}
