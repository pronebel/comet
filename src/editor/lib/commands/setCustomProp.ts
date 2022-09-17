import type { RealTimeObject } from '@convergence/convergence';

import type { CustomPropertyType } from '../../../core/lib/nodes/customProperties';
import { Command } from '.';

export class SetCustomPropCommand extends Command
{
    constructor(
        public readonly nodeId: string,
        public readonly propName: string,
        public readonly type: CustomPropertyType,
        public readonly value: any,
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
        const nodeElement = datastore.getNode(nodeId);
        const definedCustomProps = nodeElement.elementAt('customProperties', 'defined') as RealTimeObject;

        definedCustomProps.set(propName, {
            type,
            value,
        });

        // notify application, which will update object graph
        datastore.emit('datastoreCustomPropDefined', nodeId, propName, type, value);
    }

    public undo(): void
    {
        throw new Error('Method not implemented.');
    }
}
