import { ClonableNode } from '../core/nodes/abstract/clonableNode';
import type { GraphNode } from '../core/nodes/abstract/graphNode';
import { CloneMode } from '../core/nodes/cloneInfo';
import { ProjectNode } from '../core/nodes/concrete/project';
import { getInstance, getInstancesByType, getTrashInstance, getTrashInstancesByType } from '../core/nodes/instances';
import { Application } from './application';

enum Result
    {
    Tick = '✅',
    Cross = '❌',
    Dot = '⚪',
    NA = '〰️',
}

const asResult = (value: boolean) => (value ? Result.Tick : Result.Cross);

export interface GraphNodeAudit
{
    parent: string;
    children: string;
    cloner: string;
    cloneMode: string;
    cloned: string;
    isInGraph: Result;
    isInDatastore: Result;
    isCloneInfoValid: string;
}

export interface DSNodeAudit extends Omit<GraphNodeAudit, 'isInGraph' | 'isInDatastore' | 'isCloneInfoValid'>
{
    isRegistered: Result;
    isAttached: Result;
}

export interface Audit
{
    nodes: Record<string, GraphNodeAudit>;
    trash: Record<string, GraphNodeAudit>;
    datastore: Record<string, DSNodeAudit>;
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
        const { datastore } = this;
        const audit: Audit = {
            nodes: {},
            trash: {},
            datastore: {},
        };
        const instancesByType = getInstancesByType();
        const trashInstancesByType = getTrashInstancesByType();
        const datastoreRegisteredIds = datastore.getRegisteredIds();

        // nodes
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for (const [_type, ids] of Object.entries(instancesByType))
        {
            ids.forEach((id) =>
            {
                const instance = getInstance(id);

                if (instance instanceof ClonableNode)
                {
                    const node = instance as unknown as ClonableNode;

                    audit.nodes[node.id] = this.auditNode(node);
                }
            });
        }

        // trash
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for (const [_type, ids] of Object.entries(trashInstancesByType))
        {
            ids.forEach((id) =>
            {
                const instance = getTrashInstance(id);

                if (instance instanceof ClonableNode)
                {
                    const node = instance as unknown as ClonableNode;

                    audit.trash[node.id] = this.auditNode(node);
                }
            });
        }

        // datastore
        datastoreRegisteredIds.forEach((id) =>
        {
            const schema = datastore.getNodeElementSchema(id);

            audit.datastore[id] = {
                parent: schema.parent ? schema.parent : '',
                children: schema.children.join(','),
                cloner: schema.cloneInfo.cloner ? schema.cloneInfo.cloner : '',
                cloned: schema.cloneInfo.cloned.join(','),
                cloneMode: schema.cloneInfo.cloneMode,
                isRegistered: Result.Dot,
                isAttached: asResult(datastore.getNodeElement(id).isAttached()),
            };
        });

        return audit;
    }

    protected auditNode(node: ClonableNode): GraphNodeAudit
    {
        const { app, datastore } = this;

        const project = app.project as ProjectNode;
        const datastoreRegisteredIds = datastore.getRegisteredIds();

        const isInGraph = asResult(node instanceof ProjectNode ? true : project.contains(node));
        const isInDatastore = asResult(datastoreRegisteredIds.indexOf(node.id) > -1);

        const { cloneInfo, cloneInfo: { cloner, cloneMode } } = node;
        const isCloneInfoValid: string[] = [];

        if (cloner)
        {
            if (!project.contains(cloner as unknown as GraphNode))
            {
                isCloneInfoValid.push(`ClonerMissing(${cloner.id})`); // cloner not in graph
            }
            if (cloneMode === CloneMode.Original)
            {
                isCloneInfoValid.push(`OriginalHasCloner(${cloner.id})`); // original has cloner
            }
        }

        cloneInfo.forEachCloned<GraphNode>((node) =>
        {
            if (!project.contains(node as unknown as GraphNode))
            {
                isCloneInfoValid.push(`ClonedMissing(${node.id})`); // cloned not in graph
            }
        });

        return {
            parent: node.parent ? node.parent.id : '',
            children: node.children.map((node) => node.id).join(','),
            cloner: node.cloneInfo.cloner ? node.cloneInfo.cloner.id : '',
            cloned: node.cloneInfo.cloned.map((node) => node.id).join(','),
            cloneMode: node.cloneInfo.cloneMode,
            isInGraph,
            isInDatastore,
            isCloneInfoValid: asResult(isCloneInfoValid.length === 0) + isCloneInfoValid.join(','),
        };
    }
}
