import type { RealTimeObject } from '@convergence/convergence';

import { getGraphNode } from '../../core/nodes/nodeFactory';
import { AbstractCommand } from '../abstractCommand';

export interface RemoveCustomPropCommandParams
{
    nodeId: string;
    propName: string;
}

export class RemoveCustomPropCommand extends AbstractCommand<RemoveCustomPropCommandParams>
{
    public static commandName = 'RemoveCustomProp';

    public exec(): void
    {
        const { datastore, params: { nodeId, propName } } = this;
        const nodeElement = datastore.getNodeElement(nodeId);
        const definedCustomProps = nodeElement.elementAt('customProperties', 'defined') as RealTimeObject;

        // update datastore
        definedCustomProps.remove(propName);

        // update graph node
        const node = getGraphNode(nodeId);

        node.removeCustomProperty(propName);
    }

    public undo(): void
    {
        throw new Error('Method not implemented.');
    }
}
