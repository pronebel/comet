import { getUserName } from '../../editor/sync/user';
import type { ClonableNodeConstructor, NodeOptions } from './abstract/clonableNode';
import { registerInstance } from './instances';

export const nodeClasses: Map<string, ClonableNodeConstructor> = new Map();

const userName = getUserName();

export function registerNodeType(nodeClass: ClonableNodeConstructor)
{
    const nodeType = nodeClass.prototype.nodeType();

    if (nodeClasses.has(nodeType))
    {
        // throw new Error(`Node type "${nodeType}" already registered.`);
        return;
    }

    nodeClasses.set(nodeType, nodeClass);
}

export function createNode<T>(nodeType: string, options: NodeOptions<{}>): T
{
    const NodeClass = nodeClasses.get(nodeType);

    if (!NodeClass)
    {
        throw new Error(`Node type "${nodeType}" is unregistered.`);
    }

    console.log(`${userName}:createNode "${options.id}"`);

    const node = new NodeClass(options);

    registerInstance(node);

    return node as unknown as T;
}
