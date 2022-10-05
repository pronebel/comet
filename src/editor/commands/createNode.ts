import type { ModelBase } from '../../core/model/model';
import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import { CloneInfo } from '../../core/nodes/cloneInfo';
import { getInstance } from '../../core/nodes/instances';
import { createNode } from '../../core/nodes/nodeFactory';
import type { NodeSchema } from '../../core/nodes/schema';
import { Command } from '../command';
import { AssignCustomPropCommand } from './assignCustomProp';
import { SetCustomPropCommand } from './setCustomProp';

export interface CreateNodeCommandParams<M extends ModelBase>
{
    nodeSchema: NodeSchema<M>;
    isNewNode: boolean;
}

export interface CreateNodeCommandReturn
{
    node: ClonableNode;
}

export class CreateNodeCommand<
    M extends ModelBase = ModelBase,
> extends Command<CreateNodeCommandParams<M>, CreateNodeCommandReturn>
{
    public static commandName = 'CreateNode';

    public apply(): CreateNodeCommandReturn
    {
        const { datastore, params: { nodeSchema, isNewNode } } = this;

        const { id, type, model, cloneInfo: { cloneMode, cloner }, customProperties } = nodeSchema;

        if (isNewNode)
        {
            // create datastore entry
            datastore.createNode(nodeSchema);
        }
        else
        {
            // just register the model, we are loading existing nodes
            datastore.trackExistingNodeElement(id);
        }

        // build clone info
        cloner && this.app.assertNode(cloner);

        const cloneInfo = new CloneInfo(cloneMode, cloner ? getInstance<ClonableNode>(cloner) : undefined);

        // re-use or create and register graph node
        const node = createNode<ClonableNode>(type, { id, model, cloneInfo });

        node.created = nodeSchema.created;

        if (nodeSchema.parent && !isNewNode)
        {
            this.app.assertNode(nodeSchema.parent);

            const parentNode = getInstance<ClonableNode>(nodeSchema.parent);

            parentNode.addChild(node);
        }

        // build defined custom properties
        for (const [customKey, definedProp] of Object.entries(customProperties.defined))
        {
            const { type, value } = definedProp;

            new SetCustomPropCommand({ nodeId: nodeSchema.id, customKey, type, value, updateMode: 'graphOnly' }).run();
        }

        // build assigned custom properties
        for (const [modelKey, customKey] of Object.entries(customProperties.assigned))
        {
            new AssignCustomPropCommand({ nodeId: nodeSchema.id, modelKey, customKey, updateMode: 'graphOnly' }).run();
        }

        return { node };
    }

    public undo(): void
    {
        throw new Error('Unimplemented');
    }
}
