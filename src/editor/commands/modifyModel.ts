import type { ModelBase } from '../../core/model/model';
import { getGraphNode } from '../../core/nodes/nodeFactory';
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

        // update datastore
        datastore.modifyNodeModel(nodeId, values);

        // update graph node
        node.model.setValues(values);
    }

    public undo(): void
    {
        throw new Error('Method not implemented.');
    }
}
