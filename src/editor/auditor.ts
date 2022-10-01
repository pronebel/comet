import { deepEqual } from 'fast-equals';

import type { ClonableNode } from '../core/nodes/abstract/clonableNode';
import type { GraphNode } from '../core/nodes/abstract/graphNode';
import { CloneMode } from '../core/nodes/cloneInfo';
import type { ProjectNode } from '../core/nodes/concrete/project';
import { getInstance, getInstancesByType } from '../core/nodes/instances';
import { type NodeSchema, getNodeSchema } from '../core/nodes/schema';
import { Application } from './application';

const tick = '✅';
const cross = '❌';

export interface Audit
{
    instancesByType: Record<string, string[]>;
    datastoreRegisteredIds: string[];
    datastoreRemovedCacheIds: string[];
}

export class Auditor
{
    protected get app()
    {
        return Application.instance;
    }

    protected get datastore()
    {
        return this.app.datastore;
    }

    protected get undoStack()
    {
        return this.app.undoStack;
    }

    public audit(): Audit
    {
        const { app, datastore } = this;

        const instancesByType = getInstancesByType();
        const project = app.project;

        if (!project)
        {
            throw Error('No project defined');
        }

        // verify all Empty nodes
        if (instancesByType['Empty'])
        {
            instancesByType['Empty'] = this.verifyNodes(project, instancesByType['Empty']);
        }

        // verify all Debug nodes
        if (instancesByType['Debug'])
        {
            instancesByType['Debug'] = this.verifyNodes(project, instancesByType['Debug']);
        }

        // verify datastore
        // const data = datastore.toJSON();
        const datastoreRegisteredIds = datastore.getRegisteredIds();
        const datastoreRemovedCacheIds = datastore.getRemovedCacheIds();

        return {
            instancesByType,
            datastoreRegisteredIds,
            datastoreRemovedCacheIds,
        };
    }

    protected verifyNodes(root: ProjectNode, nodeIds: string[])
    {
        const { datastore } = this;

        return nodeIds.map((id) =>
        {
            const errors: string[] = [];

            const node = getInstance<ClonableNode>(id);

            // verify project contains node
            if (!root.contains(node))
            {
                errors.push('Not in graph');
            }

            // verify all clone references are in project tree
            const { cloneInfo, cloneInfo: { cloner, cloneMode } } = node;

            if (cloner)
            {
                if (!root.contains(cloner as unknown as GraphNode))
                {
                    errors.push(`Cloner "${cloner.id}" not in graph`);
                }
                if (cloneMode === CloneMode.Original)
                {
                    errors.push('Original still has cloner');
                }
            }

            cloneInfo.forEachCloned<GraphNode>((node) =>
            {
                if (!root.contains(node as unknown as GraphNode))
                {
                    errors.push(`Cloned "${node.id}" not in graph`);
                }
            });

            // verify datastore has RealTimeObject
            let dsNodeSchema: NodeSchema | undefined;

            try
            {
                dsNodeSchema = datastore.getNodeElementSchema(id);
            }
            catch (e)
            {
                errors.push('Could not get datastore schema');
            }
            const nodeSchema = getNodeSchema(node);

            if (!deepEqual(dsNodeSchema, nodeSchema))
            {
                errors.push('DS schema !== node schema');
            }

            return errors.length === 0 ? `${id}${tick}` : `${id}${cross}${errors.join(`,${cross}`)}`;
        });
    }
}
