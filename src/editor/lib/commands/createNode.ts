import type { ModelBase } from '../../../core/lib/model/model';
import {  getAllCloneUpdateRefs } from '../../../core/lib/nodes/abstract/clonableNode';
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
            const nodeOptions: NodeOptionsSchema<M> = {
                parent: parentId,
                model,
            };

            // update down through all cloned copies
            const cloneRefs = getAllCloneUpdateRefs(parentNode, true);

            console.log('Clone refs:', cloneRefs.map((node) => node.id));

            // return;

            let lastNodeId: string | undefined;

            datastore.batch(() =>
            {
                cloneRefs.forEach((node) =>
                {
                    let { cloneMode } = node.cloneInfo;

                    if (cloneMode === CloneMode.ReferenceRoot)
                    {
                        cloneMode = CloneMode.Reference;
                    }

                    const nodeSchema = createNodeSchema<M>(nodeType, {
                        ...nodeOptions,
                        parent: node.id,
                        cloneInfo: {
                            cloneMode,
                            cloner: lastNodeId,
                            cloned: [],
                        },
                    });

                    datastore.createNode(nodeSchema, {
                        ...nodeOptions,
                        parent: node.id,
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
