import type { RealTimeArray } from '@convergence/convergence';

import { getGraphNode } from '../../core/nodes/factory';
import { AbstractCommand } from '../baseCommand';

export interface SetParentCommandParams
{
    parentId: string;
    childId: string;
}
export class SetParentCommand extends AbstractCommand<SetParentCommandParams>
{
    public static commandName = 'SetParent';

    public exec(): void
    {
        const { datastore, params: { parentId, childId } } = this;

        const parentElement = datastore.getNodeElement(parentId);
        const childElement = datastore.getNodeElement(childId);

        // set parent data
        childElement.set('parent', parentId);

        // set children data
        const childArray = parentElement.get('children') as RealTimeArray;

        childArray.push(childId);

        const parentNode = getGraphNode(parentId);
        const childNode = getGraphNode(childId);

        if (parentNode && childNode)
        {
            parentNode?.addChild(childNode);
        }
    }

    public undo(): void
    {
        throw new Error('Method not implemented.');
    }
}
