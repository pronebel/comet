import type { id } from '../../editor/lib/sync/schema';
import type { ClonableNode } from './node/clonableNode';
import type { ProjectNode } from './node/types/project';
import type { SyncAdapter } from './sync';

export class Document
{
    public sync: SyncAdapter;

    protected _project?: ProjectNode;
    protected nodesById: Map<id, ClonableNode>;

    private static _instance: Document;

    public static get instance()
    {
        if (!Document._instance)
        {
            throw new Error('Document not defined');
        }

        return Document._instance;
    }

    constructor(sync: SyncAdapter)
    {
        if (!Document._instance)
        {
            Document._instance = this;
        }

        this.nodesById = new Map();

        this.sync = sync;
    }

    public get project()
    {
        if (!this._project)
        {
            throw new Error('Project not found');
        }

        return this._project;
    }

    public set project(project: ProjectNode)
    {
        this._project = project;
    }

    public registerNode(node: ClonableNode)
    {
        const { id } = node;
        const { nodesById } = this;

        if (nodesById.has(id))
        {
            throw new Error(`Node with id "${id}" already registered.`);
        }

        console.log('register node', id);
        nodesById.set(id, node);
    }
}
