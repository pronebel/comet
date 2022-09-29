import type { ModelBase } from '../../core/model/model';
import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import { getInstance } from '../../core/nodes/instances';
import { AbstractCommand } from '../abstractCommand';

export interface ModifyModelCommandParams<M>
{
    nodeId: string;
    values: Partial<M>;
}

export interface ModifyModelCommandCache<M>
{
    prevValues?: Partial<M>;
}

export class ModifyModelCommand<M extends ModelBase>
    extends AbstractCommand<ModifyModelCommandParams<M>, void, ModifyModelCommandCache<M>>
{
    public static commandName = 'ModifyModel';

    public exec(): void
    {
        const { datastore, params: { nodeId, values }, cache } = this;
        const node = getInstance<ClonableNode>(nodeId);

        // update datastore
        datastore.modifyNodeModel(nodeId, values);

        // update graph node
        const prevValues = node.model.setValues(values) as Partial<M>;

        if (!cache.prevValues)
        {
            // don't update if values already cached
            this.cache.prevValues = prevValues;
        }
    }

    public undo(): void
    {
        const { cache: { prevValues }, params: { nodeId } } = this;

        if (prevValues)
        {
            new ModifyModelCommand({ nodeId, values: prevValues }).exec();
        }
    }
}
