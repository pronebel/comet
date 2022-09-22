import type { RealTimeObject } from '@convergence/convergence';

import type { CustomPropertyType, CustomPropertyValueType } from '../../../core/lib/nodes/customProperties';
import { Command } from '.';

export class SetCustomPropCommand extends Command<{
    nodeId: string;
    propName: string;
    type: CustomPropertyType;
    value: CustomPropertyValueType;
}>
{
    public static commandName = 'SetCustomProp';

    public apply(): void
    {
        const { datastore, params: { nodeId, propName, type, value } } = this;

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
