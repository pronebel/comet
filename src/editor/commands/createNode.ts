import type { ModelBase } from '../../core/model/model';
import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import { CloneInfo } from '../../core/nodes/cloneInfo';
import { createGraphNode, getGraphNode } from '../../core/nodes/factory';
import type { NodeSchema } from '../../core/nodes/schema';
import { AbstractCommand } from '../abstractCommand';
import type { Datastore } from '../sync/datastore';

export interface CreateNodeCommandParams<M extends ModelBase>
{
    nodeSchema: NodeSchema<M>;
}

export interface CreateNodeCommandReturn
{
    node: ClonableNode;
}

export class CreateNodeCommand<
    M extends ModelBase = ModelBase,
> extends AbstractCommand<CreateNodeCommandParams<M>, CreateNodeCommandReturn>
{
    public static commandName = 'CreateNode';

    public static createNode(datastore: Datastore, nodeSchema: NodeSchema): CreateNodeCommandReturn
    {
        const { type, id, model, cloneInfo: { cloneMode, cloner, cloned }, customProperties } = nodeSchema;

        datastore.createNodeSchema(nodeSchema);

        // build clone info
        const cloneInfo = new CloneInfo(cloneMode, cloner ? getGraphNode(cloner) : undefined);

        cloned.forEach((id) =>
        {
            const node = getGraphNode(id);

            cloneInfo.cloned.push(node);
        });

        // create and register graph node
        const node = createGraphNode(type,
            { id, model, cloneInfo });

        node.created = nodeSchema.created;

        // build custom properties
        for (const [name, props] of Object.entries(customProperties.defined))
        {
            props.forEach(({ type, value }) => node.setCustomProperty(name, type, value));
        }

        for (const [modelKey, customPropertyKey] of Object.entries(customProperties.assigned))
        {
            node.assignCustomProperty(modelKey, customPropertyKey);
        }

        return { node: node as ClonableNode };
    }

    public exec(): CreateNodeCommandReturn
    {
        const { datastore, params: { nodeSchema } } = this;

        return CreateNodeCommand.createNode(datastore, nodeSchema);
    }

    public undo(): void
    {
        throw new Error('Method not implemented.');
    }
}
