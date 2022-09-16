import { EventEmitter } from 'eventemitter3';

import { CloneInfo } from '../../../core/lib/nodes/cloneInfo';
import { createGraphNode, getGraphNode } from '../../../core/lib/nodes/factory';
import type { Datastore } from './datastore';
import { hydrate } from './hydrate';
import type { NodeSchema } from './schema';

export type ObjectGraphEvent = 'nodeCreated';

export class ObjectGraph extends EventEmitter<ObjectGraphEvent>
{
    public onDatastoreNodeCreated = (nodeSchema: NodeSchema<{}>) =>
    {
        const { type, id, model, cloneInfo: { cloneMode, cloner, cloned }, customProperties } = nodeSchema;

        // build clone info
        const cloneInfo = new CloneInfo(cloneMode, getGraphNode(cloner));

        cloned.forEach((id) =>
        {
            const node = getGraphNode(id);

            node && cloneInfo.cloned.push(node);
        });

        // create node

        const node = createGraphNode(type,
            { id, model, cloneInfo });

        // build custom properties
        for (const [name, { type, value }] of Object.entries(customProperties.defined))
        {
            node.setCustomProperty(name, type, value);
        }

        for (const [modelKey, customPropertyKey] of Object.entries(customProperties.assigned))
        {
            node.assignCustomProperty(modelKey, customPropertyKey);
        }

        this.emit('nodeCreated', node);
    };

    public onDatastoreNodeChildAdded = (parentId: string, childId: string) =>
    {
        const parentNode = getGraphNode(parentId);
        const childNode = getGraphNode(childId);

        if (parentNode && childNode)
        {
            parentNode.addChild(childNode);
        }
    };

    public hydrate(datastore: Datastore)
    {
        hydrate(datastore).forEach((node) => this.emit('nodeCreated', node));
    }
}
