import type { RealTimeModel, RealTimeObject } from '@convergence/convergence';

import type { ClonableNode } from '../../../core/lib/nodes/abstract/clonableNode';
import { createNode } from '../../../core/lib/nodes/factory';

export function openModel<T>(model: RealTimeModel): T
{
    console.log(`Opening model "${model.modelId()}"`);

    const nodes = readNodes(model);

    nestNodes(model.root().get('hierarchy') as RealTimeObject, nodes);

    const rootNodeId = model.elementAt('root').value() as string;

    const root = nodes.get(rootNodeId);

    return root as unknown as T;
}

export function readNodes(model: RealTimeModel)
{
    const nodes: Map<string, ClonableNode> = new Map();

    const nodeMap = model.elementAt('nodes') as RealTimeObject;

    nodeMap.keys().forEach((id) =>
    {
        const nodeElement = nodeMap.get(id) as RealTimeObject;
        const nodeType = nodeElement.get('type').value() as string;

        const node = createNode(nodeType, { id });

        nodes.set(id, node);
    });

    return nodes;
}

export function nestNodes(hierarchy: RealTimeObject, nodeMap: Map<string, ClonableNode>)
{
    hierarchy.keys().forEach((parentId) =>
    {
        const childId = hierarchy.get(parentId).value();
        const parentNode = nodeMap.get(parentId);
        const childNode = nodeMap.get(childId);

        if (parentNode && childNode)
        {
            parentNode.addChild(childNode);
        }
    });
}
