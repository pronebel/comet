import type { RealTimeObject } from '@convergence/convergence';

import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import { getGraphNode } from '../../core/nodes/nodeFactory';
import { AbstractCommand } from '../abstractCommand';
import { UnAssignCustomPropCommand } from './unassignCustomProp';

export interface RemoveCustomPropCommandParams
{
    nodeId: string;
    customKey: string;
    isRemoteUpdate: boolean;
}

export class RemoveCustomPropCommand extends AbstractCommand<RemoveCustomPropCommandParams>
{
    public static commandName = 'RemoveCustomProp';

    public exec(): void
    {
        const { datastore, params: { nodeId, customKey, isRemoteUpdate } } = this;

        if (!isRemoteUpdate)
        {
            // update datastore
            const nodeElement = datastore.getNodeElement(nodeId);
            const definedCustomProps = nodeElement.elementAt('customProperties', 'defined') as RealTimeObject;

            definedCustomProps.remove(customKey);
        }

        // update graph node
        const node = getGraphNode(nodeId);

        node.removeCustomProperty(customKey);

        // update node tree
        node.walk<ClonableNode>((node) =>
        {
            node.getAssignedModelKeys(customKey).forEach((modelKey) =>
            {
                new UnAssignCustomPropCommand({
                    nodeId: node.id,
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
