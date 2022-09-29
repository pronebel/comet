import type { RealTimeObject } from '@convergence/convergence';

import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import type { CustomPropertyType, CustomPropertyValueType } from '../../core/nodes/customProperties';
import { getInstance } from '../../core/nodes/instances';
import { type UpdateMode, AbstractCommand } from '../abstractCommand';
import { AssignCustomPropCommand } from './assignCustomProp';

export interface SetCustomPropCommandParams
{
    nodeId: string;
    customKey: string;
    type: CustomPropertyType;
    value: CustomPropertyValueType | undefined;
    updateMode: UpdateMode;
}

export class SetCustomPropCommand extends AbstractCommand<SetCustomPropCommandParams>
{
    public static commandName = 'SetCustomProp';

    public exec(): void
    {
        const { datastore, params: { nodeId, customKey, type, value, updateMode } } = this;

        const nodeElement = datastore.getNodeElement(nodeId);
        const definedCustomProps = nodeElement.elementAt('customProperties', 'defined') as RealTimeObject;

        if (updateMode === 'full')
        {
            // update datastore
            definedCustomProps.set(customKey, {
                type,
                value,
            });
        }

        // update graph node
        const node = getInstance<ClonableNode>(nodeId);

        node.setCustomProperty(customKey, type, value);

        // update node tree
        node.walk<ClonableNode>((node) =>
        {
            node.getAssignedModelKeys(customKey).forEach((modelKey) =>
            {
                new AssignCustomPropCommand({
                    nodeId: node.id,
                    customKey,
                    modelKey,
                    updateMode,
                }).exec();
            });
        });
    }

    public undo(): void
    {
        throw new Error('Method not implemented.');
    }
}
