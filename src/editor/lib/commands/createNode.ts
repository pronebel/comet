import type { ModelBase } from '../../../core/lib/model/model';
import { type ClonableNode, getAllCloned, getAllCloners } from '../../../core/lib/nodes/abstract/clonableNode';
import { sortNode } from '../../../core/lib/nodes/abstract/graphNode';
import { getGraphNode, newGraphNodeId } from '../../../core/lib/nodes/factory';
import { type NodeOptionsSchema, createNodeSchema } from '../sync/schema';
import { Command } from '.';

export class CreateNodeCommand<M extends ModelBase> extends Command
{
    constructor(
        public readonly nodeType: string,
        public readonly nodeOptions: NodeOptionsSchema<M> = {},
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
        const { nodeType, datastore, nodeOptions } = this;

        if (nodeOptions.parent)
        {
            const primaryParentId = nodeOptions.parent;

            // create primary new node
            const nodeSchema = createNodeSchema<M>(nodeType, nodeOptions);

            console.log(`Primary node: ${primaryParentId}->${nodeSchema.id}`);

            datastore.createNode(nodeSchema, nodeOptions);

            // update down through all cloned copies
            const parentNode = getGraphNode(primaryParentId) as ClonableNode;
            const cloneRefs = getAllCloned(parentNode);

            // update up through cloners, but only for references
            const parentCloners = getAllCloners(parentNode, (node) =>
            {
                const { isReferenceOrRoot, isOriginal, hasCloned } = node.cloneInfo;

                return parentNode.cloneInfo.isReferenceOrRoot && (isReferenceOrRoot || (isOriginal && hasCloned));
            });

            parentCloners.sort(sortNode());

            if (parentCloners.length > 0)
            {
                const parentCloner = parentCloners[0];
                const parentClonerCloned = getAllCloned(parentCloner);

                cloneRefs.push(parentCloner);

                parentClonerCloned.forEach((node) =>
                {
                    if (cloneRefs.indexOf(node) === -1 && node.id !== primaryParentId)
                    {
                        cloneRefs.push(node);
                    }
                });
            }

            cloneRefs.sort(sortNode());

            console.log('Clone refs:', cloneRefs.map((node) => node.id));

            // return;

            let lastNodeId = nodeSchema.id;

            cloneRefs.forEach((node) =>
            {
                const { cloneMode } = node.cloneInfo;
                const nodeSchema = createNodeSchema<M>(nodeType, {
                    ...nodeOptions,
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

                const newNode = getGraphNode(nodeSchema.id);
                const lastNode = getGraphNode(lastNodeId);

                if (newNode && lastNode)
                {
                    lastNode?.cloneInfo.cloned.push(newNode);
                }

                lastNodeId = nodeSchema.id;
            });
        }
    }

    public undo(): void
    {
        throw new Error('Method not implemented.');
    }
}
