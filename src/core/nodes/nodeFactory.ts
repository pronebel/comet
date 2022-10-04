import EventEmitter from 'eventemitter3';

import { getUserName } from '../../editor/sync/user';
import type { ModelValue } from '../model/model';
import type { ClonableNode, ClonableNodeConstructor, NodeOptions } from './abstract/clonableNode';
import { isInstanceInTrash, registerInstance, restoreInstance } from './instances';

export const nodeClasses: Map<string, ClonableNodeConstructor> = new Map();

export type NodeFactoryEvents = 'created' | 'disposed' | 'modelModified' | 'childAdded' | 'childRemoved';

export const nodeFactoryEmitter: EventEmitter<NodeFactoryEvents> = new EventEmitter<NodeFactoryEvents>();

const logStyle = 'color:#8bc34a';
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
        throw new Error(`${userName}:Node type "${nodeType}" is unregistered.`);
    }

    const { id } = options;

    if (id && isInstanceInTrash(id))
    {
        return restoreInstance<T>(id);
    }

    console.log(`%c${userName}:createNode "${id}"`, logStyle);

    const node = new NodeClass(options) as ClonableNode;

    registerInstance(node);
    registerNewNode(node);

    return node as unknown as T;
}

export function registerNewNode(node: ClonableNode)
{
    console.log(`%c${userName}:Registering node "${node.id}"`, logStyle);

    const onModelModified = (key: string, value: ModelValue, oldValue: ModelValue) =>
    {
        nodeFactoryEmitter.emit('modelModified', node, key, value, oldValue);
    };

    const onChildAdded = (node: ClonableNode) =>
    {
        nodeFactoryEmitter.emit('childAdded', node);
    };

    const onChildRemoved = (node: ClonableNode) =>
    {
        nodeFactoryEmitter.emit('childRemoved', node);
    };

    const onDisposed = () =>
    {
        node.off('disposed', onDisposed);
        node.off('modelChanged', onModelModified);
        node.off('childAdded', onChildAdded);
        node.off('childRemoved', onChildRemoved);
        nodeFactoryEmitter.emit('disposed', node);
    };

    node.on('disposed', onDisposed);
    node.on('modelChanged', onModelModified);
    node.on('childAdded', onChildAdded);
    node.on('childRemoved', onChildRemoved);

    nodeFactoryEmitter.emit('created', node);
}
