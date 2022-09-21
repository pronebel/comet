import type { id } from '../../../editor/lib/sync/schema';
import type { ClonableNode, ClonableNodeConstructor, NodeOptions } from './abstract/clonableNode';

export const nodeClasses: Map<id, ClonableNodeConstructor> = new Map();
export const nodeInstances: Map<id, ClonableNode> = new Map();
export const nodeIdCount = {} as Record<string, number>;

export function registerGraphNodeType(nodeClass: ClonableNodeConstructor)
{
    const nodeType = nodeClass.prototype.nodeType();

    if (nodeClasses.has(nodeType))
    {
        // throw new Error(`Node type "${nodeType}" already registered.`);
        return;
    }

    nodeClasses.set(nodeType, nodeClass);
}

export function getGraphNode(id?: string)
{
    if (id)
    {
        return nodeInstances.get(id);
    }

    return undefined;
}

export function createGraphNode(nodeType: string, options: NodeOptions<{}>)
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

export function registerGraphNode(node: ClonableNode)
{
    const { id } = node;

    if (nodeInstances.has(id))
    {
        throw new Error(`Node with id "${id}" already registered.`);
    }

    nodeInstances.set(id, node);

    return node;
}

export function disposeGraphNode(node: ClonableNode)
{
    nodeInstances.delete(node.id);
}

export function nextGraphNodeId(nodeType: string, isUnregisteredType = false)
{
    if (!isUnregisteredType)
    {
        const NodeClass = nodeClasses.get(nodeType);

        if (!NodeClass)
        {
            throw new Error(`Node type "${nodeType}" is unregistered.`);
        }
    }

    if (!nodeIdCount[nodeType])
    {
        return 1;
    }

    return nodeIdCount[nodeType] + 1;
}

export function newGraphNodeId(nodeType: string, isUnregisteredType = false)
{
    const nextId = nextGraphNodeId(nodeType, isUnregisteredType);

    nodeIdCount[nodeType] = nextId;

    return `${nodeType}:${nextId}`;
}

export function consolidateNodeId(id: string)
{
    const [nodeType, _idCount] = id.split(':');
    const idCount = parseInt(_idCount, 10);

    nodeIdCount[nodeType] = Math.max(isNaN(nodeIdCount[nodeType]) ? 1 : nodeIdCount[nodeType], idCount);
}

(window as any).node = (id: string) => getGraphNode(id);
