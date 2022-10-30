import { EventEmitter } from 'eventemitter3';

import type { ContainerNode } from '../../core/nodes/concrete/container';

export type NodeSelectionEvent = 'add' | 'remove';

export class NodeSelection extends EventEmitter<NodeSelectionEvent>
{
    public readonly nodes: ContainerNode[];

    constructor()
    {
        super();

        this.nodes = [];
    }

    public add(node: ContainerNode)
    {
        this.nodes.push(node);

        this.emit('add', node);
    }

    public remove(node: ContainerNode)
    {
        const index = this.nodes.indexOf(node);

        if (index === -1)
        {
            throw new Error(`Cannot remove node "${node.id}" from selection, not found`);
        }

        this.nodes.splice(index, 1);

        this.emit('remove', node);
    }

    public set(node: ContainerNode)
    {
        this.deselect();
        this.add(node);
    }

    public deselect()
    {
        const nodes = [...this.nodes];

        nodes.forEach((selectedNode) => this.remove(selectedNode));
    }

    public get length()
    {
        return this.nodes.length;
    }

    public get isEmpty()
    {
        return this.nodes.length === 0;
    }

    public get isSingle()
    {
        return this.nodes.length === 1;
    }

    public get isMulti()
    {
        return this.nodes.length > 1;
    }

    public get firstNode(): ContainerNode | undefined
    {
        const { nodes } = this;

        if (nodes.length === 0)
        {
            return undefined;
        }

        return nodes[0];
    }

    public get lastNode(): ContainerNode | undefined
    {
        const { nodes } = this;

        if (nodes.length === 0)
        {
            return undefined;
        }

        return nodes[nodes.length - 1];
    }

    public isSelected(node: ContainerNode)
    {
        return this.nodes.indexOf(node) > -1;
    }

    public forEach(fn: (node: ContainerNode, i: number) => void)
    {
        this.nodes.forEach(fn);
    }
}
