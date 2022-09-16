import type { RealTimeObject } from '@convergence/convergence';

import type { ClonableNode } from '../../../core/lib/nodes/abstract/clonableNode';
import type { GraphNode } from '../../../core/lib/nodes/abstract/graphNode';
import { createGraphNode, trackNodeId } from '../../../core/lib/nodes/factory';
import type { Datastore } from './datastore';

export function hydrate(datastore: Datastore)
{
    const { nodes, hierarchy } = datastore;

    const graphNodes = createGraphNodes(nodes);

    nestGraphNodes(hierarchy, graphNodes);

    return graphNodes;
}

function createGraphNodes(nodes: RealTimeObject)
{
    const graphNodes: Map<string, ClonableNode> = new Map();

    nodes.keys().forEach((id) =>
    {
        const nodeElement = nodes.get(id) as RealTimeObject;
        const nodeType = nodeElement.get('type').value() as string;

        // ensure local ids don't clash with hydrating ids
        trackNodeId(id);

        // extract model
        const model = nodeElement.get('model').toJSON() as object;

        // create object graph node
        const node = createGraphNode(nodeType, { id, model });

        graphNodes.set(id, node);
    });

    return graphNodes;
}

function nestGraphNodes(hierarchy: RealTimeObject, graphNodes: Map<string, ClonableNode>)
{
    hierarchy.keys().forEach((parentId) =>
    {
        const childId = hierarchy.get(parentId).value();
        const parentNode = graphNodes.get(parentId);
        const childNode = graphNodes.get(childId);

        if (parentNode && childNode)
        {
            parentNode.addChild(childNode as GraphNode);
        }
    });
}
