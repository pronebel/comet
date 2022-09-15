import type { id } from '../../../editor/lib/sync/schema';
import type { ClonableNode, ClonableNodeConstructor, NodeOptions } from './clonableNode';

export const nodeClasses: Map<id, ClonableNodeConstructor> = new Map();
export const nodeInstances: Map<id, ClonableNode> = new Map();
export const nodeIdCount = {} as Record<string, number>;

export function registerNodeType(nodeClass: ClonableNodeConstructor)
{
    const nodeType = nodeClass.nodeType();

    if (nodeClasses.has(nodeType))
    {
        throw new Error(`Node type "${nodeType}" already registered.`);
    }

    nodeClasses.set(nodeType, nodeClass);
}

export function create(nodeType: string, options?: NodeOptions<any>)
{
    const NodeClass = nodeClasses.get(nodeType);

    if (!NodeClass)
    {
        throw new Error(`Node type "${nodeType}" is unregistered.`);
    }

    const node = new NodeClass(options);
    const { id } = node;

    if (nodeInstances.has(id))
    {
        throw new Error(`Node with id "${id}" already registered.`);
    }

    nodeInstances.set(id, node);

    return node;
}

export function dispose(node: ClonableNode)
{
    nodeInstances.delete(node.id);
}

export function newNodeId(nodeType: string)
{
    const NodeClass = nodeClasses.get(nodeType);

    if (!NodeClass)
    {
        throw new Error(`Node type "${nodeType}" is unregistered.`);
    }

    if (!nodeIdCount[nodeType])
    {
        nodeIdCount[nodeType] = 1;
    }

    return nodeIdCount[nodeType]++;
}
