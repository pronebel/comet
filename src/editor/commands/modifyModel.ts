import type { RealTimeObject } from '@convergence/convergence';

import type { ModelBase } from '../../core/model/model';
import { getGraphNode } from '../../core/nodes/factory';
import { AbstractCommand } from '../abstractCommand';

export interface ModifyModelCommandParams<M>
{
    nodeId: string;
    values: Partial<M>;
}

export class ModifyModelCommand<M extends ModelBase> extends AbstractCommand<ModifyModelCommandParams<M>>
{
    public static commandName = 'ModifyModel';

    public exec(): void
    {
        const { datastore, params: { nodeId, values } } = this;
        const node = getGraphNode(nodeId);
        const nodeElement = datastore.getNodeElement(nodeId);
        const model = nodeElement.get('model') as RealTimeObject;

        datastore.batch(() =>
        {
            for (const [k, v] of Object.entries(values))
            {
                model.set(k, v);
            }
        });

        node.model.setValues(values);
    }

    public undo(): void
    {
        throw new Error('Method not implemented.');
    }
}
