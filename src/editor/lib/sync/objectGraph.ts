import type { RealTimeObject } from '@convergence/convergence';
import { EventEmitter } from 'eventemitter3';

import type { ClonableNode } from '../../../core/lib/nodes/abstract/clonableNode';
import type { GraphNode } from '../../../core/lib/nodes/abstract/graphNode';
import { CloneInfo } from '../../../core/lib/nodes/cloneInfo';
import { createGraphNode, getGraphNode } from '../../../core/lib/nodes/factory';
import type { Datastore } from './datastore';
import type { NodeSchema } from './schema';

export type ObjectGraphEvent = 'nodeCreated';

export class ObjectGraph extends EventEmitter<ObjectGraphEvent>
{
    public createNode = (nodeSchema: NodeSchema<{}>) =>
    {
        console.log('!node created', nodeSchema);

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

    public childAdded = (parentId: string, childId: string) =>
    {
        console.log('!child added', parentId, childId);

        const parentNode = getGraphNode(parentId);
        const childNode = getGraphNode(childId);

        if (parentNode && childNode)
        {
            parentNode.addChild(childNode);
        }
    };

    public hydrate(datastore: Datastore)
    {
        const { model, nodes, hierarchy } = datastore;

        console.log(`Opening model "${model.modelId()}"`);

        const graphNodes = this.createGraphNodes(nodes);

        this.nestGraphNodes(hierarchy, graphNodes);

        graphNodes.forEach((node) => this.emit('nodeCreated', node));
    }

    protected createGraphNodes(nodes: RealTimeObject)
    {
        const graphNodes: Map<string, ClonableNode> = new Map();

        nodes.keys().forEach((id) =>
        {
            const nodeElement = nodes.get(id) as RealTimeObject;
            const nodeType = nodeElement.get('type').value() as string;

            const node = createGraphNode(nodeType, { id });

            graphNodes.set(id, node);
        });

        return graphNodes;
    }

    protected nestGraphNodes(hierarchy: RealTimeObject, graphNodes: Map<string, ClonableNode>)
    {
        hierarchy.keys().forEach((parentId) =>
        {
            const childId = hierarchy.get(parentId).value();
            const parentNode = graphNodes.get(parentId);
            const childNode = graphNodes.get(childId);

            if (parentNode && childNode)
            {
                parentNode.addChild(childNode as GraphNode);
            }
        });
    }
}
