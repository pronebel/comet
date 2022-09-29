import type { RealTimeObject } from '@convergence/convergence';

import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import { getInstance } from '../../core/nodes/instances';
import { type UpdateMode, AbstractCommand } from '../abstractCommand';
import { UnAssignCustomPropCommand } from './unassignCustomProp';

export interface RemoveCustomPropCommandParams
{
    nodeId: string;
    customKey: string;
    updateMode: UpdateMode;
}

export class RemoveCustomPropCommand extends AbstractCommand<RemoveCustomPropCommandParams>
{
    public static commandName = 'RemoveCustomProp';

    public apply(): void
    {
        const { datastore, params: { nodeId, customKey, updateMode } } = this;

        if (updateMode === 'full')
        {
            // update datastore
            const nodeElement = datastore.getNodeElement(nodeId);
            const definedCustomProps = nodeElement.elementAt('customProperties', 'defined') as RealTimeObject;

            definedCustomProps.remove(customKey);
        }

        // update graph node
        const node = getInstance<ClonableNode>(nodeId);

        node.removeCustomProperty(customKey);

        // update node tree
        node.walk<ClonableNode>((node) =>
        {
            node.getAssignedModelKeys(customKey).forEach((modelKey) =>
            {
                new UnAssignCustomPropCommand({
                    nodeId: node.id,
                    modelKey,
                    updateMode,
                }).run();
            });
        });
    }

    public undo(): void
    {
        throw new Error('Method not implemented.');
    }
}
