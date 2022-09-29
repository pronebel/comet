import EventEmitter from 'eventemitter3';

import { getUserName } from '../../editor/sync/user';
import type { ClonableNode, ClonableNodeConstructor, NodeOptions } from './abstract/clonableNode';
import { registerInstance } from './instances';

export const nodeClasses: Map<string, ClonableNodeConstructor> = new Map();

export type NodeFactoryEvents = 'created' | 'disposed';
const emitter: EventEmitter<NodeFactoryEvents> = new EventEmitter<NodeFactoryEvents>();

const userName = getUserName();

export function registerNodeType(nodeClass: ClonableNodeConstructor)
{
    const nodeType = nodeClass.prototype.nodeType();

    if (nodeClasses.has(nodeType))
    {
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

    const node = new NodeClass(options) as ClonableNode;

    registerInstance(node);

    const onDisposed = () =>
    {
        node.off('disposed', onDisposed);
        emitter.emit('disposed', node);
    };

    node.on('disposed', onDisposed);
    emitter.emit('created', node);

    return node as unknown as T;
}

export function onNodeCreated(fn: (node: ClonableNode) => void)
{
    emitter.on('created', fn);
}

export function onNodeDisposed(fn: (node: ClonableNode) => void)
{
    emitter.on('disposed', fn);
}
