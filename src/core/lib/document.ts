import { Sync } from './sync';

export class Document
{
    public sync: Sync;

    private static _instance: Document;

    constructor(enableCommands = true)
    {
        if (!Document._instance)
        {
            Document._instance = this;
        }

        this.sync = new Sync(enableCommands);
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
