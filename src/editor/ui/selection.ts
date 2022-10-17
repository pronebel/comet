import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';

export class NodeSelection
{
    public nodes: ClonableNode[];

    constructor()
    {
        this.nodes = [];
    }

    public addNode(node: ClonableNode)
    {
        this.nodes.push(node);
    }

    public removeNode(node: ClonableNode)
    {
        const index = this.nodes.indexOf(node);

        if (index === -1)
        {
            throw new Error(`Cannot remove node "${node.id}" from selection, not found`);
        }

        this.nodes.splice(index, 1);
    }
}
