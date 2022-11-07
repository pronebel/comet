import { getUserLogColor, getUserName } from '../../editor/sync/user';
import type { ClonableNode, ClonableNodeConstructor, NewNodeOptions } from './abstract/clonableNode';
import { registerInstance } from './instances';

export const nodeClasses: Map<string, ClonableNodeConstructor> = new Map();

const logStyle = 'color:MediumTurquoise';
const userName = getUserName();
const userColor = getUserLogColor(userName);
const logId = `${userName}`;

export function registerNodeType(nodeClass: ClonableNodeConstructor)
{
    const nodeType = nodeClass.prototype.nodeType();

    if (nodeClasses.has(nodeType))
    {
        return;
    }

    nodeClasses.set(nodeType, nodeClass);
}

export function createNode<T>(nodeType: string, options: NewNodeOptions<{}>): T
{
    const NodeClass = nodeClasses.get(nodeType);

    if (!NodeClass)
    {
        throw new Error(`${userName}:Node type "${nodeType}" is unregistered.`);
    }

    const { id } = options;

    console.log(`%c${logId}:%cCreate Graph Node "${id}"`, userColor, logStyle);

    const node = new NodeClass(options) as ClonableNode;

    registerInstance(node);

    return node as unknown as T;
}
