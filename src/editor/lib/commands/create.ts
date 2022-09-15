import type { NodeOptions } from '../../../core/lib/nodes/abstract/clonableNode';
import { Command } from '.';

export class CreateNodeCommand extends Command
{
    constructor(
        public readonly nodeType: string,
        public readonly nodeOptions: NodeOptions<any>,
    )
    {
        super();
    }

    public apply(): void
    {
        // throw new Error('Method not implemented.');
        // todo: get document model and add new node...detect updates on other side
    }

    public undo(): void
    {
        throw new Error('Method not implemented.');
    }
}
