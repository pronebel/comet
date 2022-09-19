import type { RealTimeObject } from '@convergence/convergence';

import { Command } from '.';

export class ModifyModelCommand extends Command
{
    constructor(
        public readonly nodeId: string,
        public readonly key: string,
        public readonly value: any,
    )
    {
        super();
    }

    public name()
    {
        return 'ModifyModel';
    }

    public apply(): void
    {
        const { nodeId, key, value, datastore } = this;

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
