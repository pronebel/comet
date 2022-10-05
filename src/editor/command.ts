import { Application } from './application';
import type { CommandName } from './commandFactory';

// 'graphOnly' = update just the nodes in the node graph (usually for updates from remote users where datastore is already modified)
// 'full' = update both the graph nodes and the datastore (usually for local modifications)
export type UpdateMode = 'graphOnly' | 'full';

export type NodeTargetCommand = { params: { nodeId: string } };

export abstract class Command<ParamsType extends {} = {}, ReturnType = void, CacheType extends {} = {}>
{
    public cache: CacheType;
    public isUndoRoot: boolean;
    public hasRun: boolean;

    constructor(public readonly params: ParamsType)
    {
        this.cache = {} as CacheType;
        this.isUndoRoot = false;
        this.hasRun = false;
    }

    public static commandName = 'Untitled';

    public abstract apply(): ReturnType;
    public abstract undo(): void;

    public get name(): CommandName
    {
        return (Object.getPrototypeOf(this).constructor as {commandName: string}).commandName as CommandName;
    }

    public get index(): number
    {
        return this.app.undoStack.indexOf(this);
    }

    public run(): ReturnType
    {
        this.assert();

        const result = this.apply();

        this.hasRun = true;

        return result as unknown as ReturnType;
    }

    public redo()
    {
        this.apply();
    }

    public get app()
    {
        return Application.instance;
    }

    public get datastore()
    {
        return this.app.datastore;
    }

    public assert()
    {
        //
    }

    public toJSON()
    {
        return {
            name: this.name,
            isUndoRoot: this.isUndoRoot,
            params: this.params,
            cache: this.cache,
        };
    }
}
