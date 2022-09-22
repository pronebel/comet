import type { ModelBase } from '../../../core/lib/model/model';
import type { ClonableNode } from '../../../core/lib/nodes/abstract/clonableNode';
import { CloneMode } from '../../../core/lib/nodes/cloneInfo';
import { getGraphNode } from '../../../core/lib/nodes/factory';
import { type NodeOptionsSchema, createNodeSchema } from '../sync/schema';
import { Command } from '.';

export class CreateNodeCommand<M extends ModelBase> extends Command
{
    constructor(
        public readonly nodeType: string,
        public readonly parentId: string,
        public readonly model: Partial<M> = {},
    )
    {
        super();
    }

    public name()
    {
        return 'CreateNode';
    }

    public apply(): void
    {
        const { nodeType, datastore, parentId, model } = this;

        const parentNode = getGraphNode(parentId);

        if (parentNode)
        {
            const { cloneInfo: parentCloneInfo } = parentNode;

            const nodeOptions: NodeOptionsSchema<M> = {
                parent: parentId,
                model,
            };

            const parentsToCreateNodeUnder: ClonableNode[] = [];

            if ((parentCloneInfo.isOriginal || parentCloneInfo.isVariant))
            {
                parentsToCreateNodeUnder.push(parentNode);
            }
            else if (parentCloneInfo.isReferenceOrRoot)
            {
                const original = parentNode.getOriginal();
                const cloned = original.getAllCloned();

                parentsToCreateNodeUnder.push(original, ...cloned);
            }
            else
            {
                throw new Error(`Unsupported cloning state`);
            }

            console.log('cloning under parents:', parentsToCreateNodeUnder.map((node) => node.id));

            let lastNodeId: string | undefined;

            datastore.batch(() =>
            {
                parentsToCreateNodeUnder.forEach((parentToCreateNodeUnder) =>
                {
                    let { cloneMode } = parentToCreateNodeUnder.cloneInfo;

                    if (cloneMode === CloneMode.ReferenceRoot)
                    {
                        cloneMode = CloneMode.Reference;
                    }

                    const nodeSchema = createNodeSchema<M>(nodeType, {
                        ...nodeOptions,
                        parent: parentToCreateNodeUnder.id,
                        cloneInfo: {
                            cloneMode,
                            cloner: lastNodeId,
                            cloned: [],
                        },
                    });

                    datastore.createNode(nodeSchema, {
                        ...nodeOptions,
                        parent: parentToCreateNodeUnder.id,
                    });

                    lastNodeId = nodeSchema.id;
                });
            });
        }
    }

    public undo(): void
    {
        throw new Error('Method not implemented.');
    }
}
