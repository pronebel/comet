import { EventEmitter } from 'eventemitter3';

import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';

export type NodeSelectionEvent = 'add' | 'remove';

export class NodeSelection extends EventEmitter<NodeSelectionEvent>
{
    public nodes: ClonableNode[];

    constructor()
    {
        super();

        this.nodes = [];
    }

    public add(node: ClonableNode)
    {
        this.nodes.push(node);

        this.emit('add', node);
    }

    public remove(node: ClonableNode)
    {
        const index = this.nodes.indexOf(node);

        if (index === -1)
        {
            throw new Error(`Cannot remove node "${node.id}" from selection, not found`);
        }

        this.nodes.splice(index, 1);

        this.emit('remove', node);
    }
}
