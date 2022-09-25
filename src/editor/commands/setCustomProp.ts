import type { RealTimeObject } from '@convergence/convergence';

import type { CustomPropertyType, CustomPropertyValueType } from '../../core/nodes/customProperties';
import { getGraphNode } from '../../core/nodes/nodeFactory';
import { AbstractCommand } from '../abstractCommand';

export interface SetCustomPropCommandParams
{
    nodeId: string;
    propName: string;
    type: CustomPropertyType;
    value: CustomPropertyValueType;
}

export class SetCustomPropCommand extends AbstractCommand<SetCustomPropCommandParams>
{
    public static commandName = 'SetCustomProp';

    public exec(): void
    {
        const { datastore, params: { nodeId, propName, type, value } } = this;

        const nodeElement = datastore.getNodeElement(nodeId);

        const definedCustomProps = nodeElement.elementAt('customProperties', 'defined') as RealTimeObject;

        definedCustomProps.set(propName, {
            type,
            value,
        });

        // update graph node
        const node = getGraphNode(nodeId);

        node.setCustomProperty(propName, type, value);
    }

    public undo(): void
    {
        throw new Error('Method not implemented.');
    }
}
