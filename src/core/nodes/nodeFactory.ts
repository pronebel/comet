import { getUserName } from '../../editor/sync/user';
import type { ClonableNode, ClonableNodeConstructor, NodeOptions } from './abstract/clonableNode';
import { sortNodesByCreation } from './abstract/graphNode';

export const nodeClasses: Map<string, ClonableNodeConstructor> = new Map();
export const nodeInstances: Map<string, ClonableNode> = new Map();
export const nodeIdCount: Map<string, number> = new Map();

const userName = getUserName();

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

export function clearGraphNodeRegistrations()
{
    nodeInstances.clear();
    nodeIdCount.clear();
}

export function getGraphNode(id: string)
{
    const node = nodeInstances.get(id);

    if (!node)
    {
        throw new Error(`Could not find graph node "${id}"`);
    }

    return node;
}

(window as any).getGraphNode = getGraphNode;

export function createGraphNode(nodeType: string, options: NodeOptions<{}>)
{
    const NodeClass = nodeClasses.get(nodeType);

    if (!NodeClass)
    {
        throw new Error(`Node type "${nodeType}" is unregistered.`);
    }

    console.log(`${userName}:createGraphNode "${options.id}"`);

    const node = new NodeClass(options);

    registerGraphNode(node);

    return node;
}

export function registerGraphNode(node: ClonableNode)
{
    const { id } = node;

    if (nodeInstances.has(id))
    {
        throw new Error(`Node with id "${id}" already registered.`);
    }

    console.log(`${userName}:registerGraphNode "${id}"`);

    nodeInstances.set(id, node);

    return node;
}

export function disposeGraphNode(node: ClonableNode)
{
    nodeInstances.delete(node.id);
    compactIds(node.nodeType());
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

    if (!nodeIdCount.has(nodeType))
    {
        return 1;
    }

    return nodeIdCount.get(nodeType) as number + 1;
}

export function newGraphNodeId(nodeType: string, isUnregisteredType = false)
{
    const nextId = nextGraphNodeId(nodeType, isUnregisteredType);

    nodeIdCount.set(nodeType, nextId);

    return `${nodeType}:${nextId}`;
}

export function consolidateNodeId(id: string)
{
    const [nodeType, _idCount] = id.split(':');
    const idCount = parseInt(_idCount, 10);

    nodeIdCount.set(
        nodeType,
        Math.max(isNaN(nodeIdCount.get(nodeType) as number) ? 1 : nodeIdCount.get(nodeType) as number, idCount),
    );
}

export function compactIds(nodeType: string)
{
    const hash: Record<string, number> = {};

    Array.from(nodeInstances.keys()).forEach((nodeId) =>
    {
        const [type, id] = nodeId.split(':');

        hash[type] = Math.max(hash[type] || 0, parseInt(id, 10));
    });

    nodeIdCount.set(nodeType, hash[nodeType] || 0);

    const k = Array.from(nodeInstances.keys());

    console.log(`%c${userName}:compactIds "${nodeType}" = ${nodeIdCount.get(nodeType) as number} [${k}]`, 'color:orange');
}

export function getLatestNode()
{
    return Array.from(nodeInstances.values()).sort(sortNodesByCreation).pop();
}

(window as any).node = (id: string) => getGraphNode(id);
