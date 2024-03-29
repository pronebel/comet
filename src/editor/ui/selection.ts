import { getGlobalEmitter } from '../../core/events';
import type { DisplayObjectNode } from '../../core/nodes/abstract/displayObject';
import type { SelectionEvent } from '../events/selectionEvents';

const globalEmitter = getGlobalEmitter<SelectionEvent>();

export class NodeSelection
{
    public readonly nodes: DisplayObjectNode[];

    constructor()
    {
        this.nodes = [];
    }

    public set(node: DisplayObjectNode)
    {
        if (!this.isEmpty)
        {
            this.deselect();
        }

        this.add(node);
    }

    public add(node: DisplayObjectNode)
    {
        this.nodes.push(node);

        globalEmitter.emit('selection.add', node);
    }

    public remove(node: DisplayObjectNode)
    {
        const index = this.nodes.indexOf(node);

        if (index === -1)
        {
            throw new Error(`Cannot remove node "${node.id}" from selection, not found`);
        }

        this.nodes.splice(index, 1);

        globalEmitter.emit('selection.remove', node);
    }

    public deselect()
    {
        if (this.isEmpty)
        {
            return;
        }

        globalEmitter.emit('selection.deselect');
        this.nodes.length = 0;
    }

    public has(node: DisplayObjectNode)
    {
        return this.nodes.indexOf(node) > -1;
    }

    public forEach(fn: (node: DisplayObjectNode, i: number) => void)
    {
        this.nodes.forEach(fn);
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

    public get firstNode(): DisplayObjectNode | undefined
    {
        const { nodes } = this;

        if (nodes.length === 0)
        {
            return undefined;
        }

        return nodes[0];
    }

    public get lastNode(): DisplayObjectNode | undefined
    {
        const { nodes } = this;

        if (nodes.length === 0)
        {
            return undefined;
        }

        return nodes[nodes.length - 1];
    }
}
