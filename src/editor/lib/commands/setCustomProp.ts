import type { RealTimeObject } from '@convergence/convergence';

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

        const nodeElement = datastore.getNodeElement(nodeId);

        const definedCustomProps = nodeElement.elementAt('customProperties', 'defined') as RealTimeObject;

        definedCustomProps.set(propName, {
            type,
            value,
        });

        datastore.emit('datastoreCustomPropDefined', nodeId, propName, type, value);
    }

    public undo(): void
    {
        throw new Error('Method not implemented.');
    }
}
