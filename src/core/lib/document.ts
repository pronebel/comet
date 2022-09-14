import { ProjectNode } from './node/types/project';
import type { SyncAdapter } from './sync';

export class Document
{
    public sync: SyncAdapter;
    public project: ProjectNode;

    private static _instance: Document;

    constructor(sync: SyncAdapter)
    {
        if (!Document._instance)
        {
            Document._instance = this;
        }

        this.sync = sync;
        this.project = new ProjectNode();
    }

    public static get instance()
    {
        if (!Document._instance)
        {
            throw new Error('Document not defined');
        }

        return Document._instance;
    }
}
