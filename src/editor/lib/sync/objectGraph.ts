import { EventEmitter } from 'eventemitter3';

import { CloneInfo } from '../../../core/lib/nodes/cloneInfo';
import { createNode, getNode } from '../../../core/lib/nodes/factory';
import type { NodeSchema } from './schema';

export type ObjectGraphEvent = 'nodeCreated';

export class ObjectGraph extends EventEmitter<ObjectGraphEvent>
{
    public createNode = (nodeSchema: NodeSchema) =>
    {
        console.log('NodeCreated!', nodeSchema);

        const { type, id, model, cloneInfo: { cloneMode, cloner, cloned }, customProperties } = nodeSchema;

        // build clone info
        const cloneInfo = new CloneInfo(cloneMode, getNode(cloner));

        cloned.forEach((id) =>
        {
            const node = getNode(id);

            node && cloneInfo.cloned.push(node);
        });

        // create node

        const node = createNode(type,
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
}
