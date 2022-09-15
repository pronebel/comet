import type { CustomPropertyType } from '../../../core/lib/nodes/customProperties';
import { Command } from '.';

export class SetCustomPropCommand extends Command
{
    constructor(
        public readonly targetId: string,
        public readonly creatorId: string,
        public readonly name: string,
        public readonly type: CustomPropertyType,
        public readonly value: any,
    )
    {
        super();
    }

    public apply(): void
    {
        throw new Error('Method not implemented.');
    }

    public undo(): void
    {
        throw new Error('Method not implemented.');
    }
}
