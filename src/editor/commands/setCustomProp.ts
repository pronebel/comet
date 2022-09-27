import type { RealTimeObject } from '@convergence/convergence';

import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import type { CustomPropertyType, CustomPropertyValueType } from '../../core/nodes/customProperties';
import { getGraphNode } from '../../core/nodes/nodeFactory';
import { AbstractCommand } from '../abstractCommand';
import { AssignCustomPropCommand } from './assignCustomProp';

export interface SetCustomPropCommandParams
{
    nodeId: string;
    customKey: string;
    type: CustomPropertyType;
    value: CustomPropertyValueType | undefined;
    isRemoteUpdate: boolean;
}

export class SetCustomPropCommand extends AbstractCommand<SetCustomPropCommandParams>
{
    public static commandName = 'SetCustomProp';

    public exec(): void
    {
        const { datastore, params: { nodeId, customKey, type, value, isRemoteUpdate } } = this;

        const nodeElement = datastore.getNodeElement(nodeId);
        const definedCustomProps = nodeElement.elementAt('customProperties', 'defined') as RealTimeObject;

        if (!isRemoteUpdate)
        {
            // update datastore
            definedCustomProps.set(customKey, {
                type,
                value,
            });
        }

        // update graph node
        const node = getGraphNode(nodeId);

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
                    isRemoteUpdate,
                }).exec();
            });
        });
    }

    public undo(): void
    {
        throw new Error('Method not implemented.');
    }
}
