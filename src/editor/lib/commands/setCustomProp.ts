import type { CustomPropertyType, CustomPropertyValueType } from '../../../core/lib/nodes/customProperties';
import { Command } from '.';

export class SetCustomPropCommand extends Command
{
    constructor(
        public readonly nodeId: string,
        public readonly propName: string,
        public readonly type: CustomPropertyType,
        public readonly value: CustomPropertyValueType,
    )
    {
        super();
    }

    public name()
    {
        return 'SetCustomProp';
    }

    public apply(): void
    {
        const { nodeId, propName, type, value, datastore } = this;

        datastore.setNodeCustomProperty(nodeId, propName, type, value);
    }

    public undo(): void
    {
        throw new Error('Method not implemented.');
    }
}
