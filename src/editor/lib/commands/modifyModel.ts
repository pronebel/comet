import type { RealTimeObject } from '@convergence/convergence';

import type { ModelBase } from '../../../core/lib/model/model';
import { Command } from '.';

export class ModifyModelCommand<M extends ModelBase> extends Command<{
    nodeId: string;
    values: Partial<M>;
}>
{
    public static commandName = 'ModifyModel';

    public apply(): void
    {
        const { datastore, params: { nodeId, values } } = this;

        const nodeElement = datastore.getNodeElement(nodeId);

        const model = nodeElement.get('model') as RealTimeObject;

        datastore.batch(() =>
        {
            for (const [k, v] of Object.entries(values))
            {
                model.set(k, v);
            }
        });

        datastore.emit('datastoreModelModified', nodeId, values);
    }

    public undo(): void
    {
        throw new Error('Method not implemented.');
    }
}
