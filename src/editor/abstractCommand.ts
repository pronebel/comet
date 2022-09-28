import { Application } from './application';
import type { CommandName } from './commandFactory';

// 'graphOnly' = update just the nodes in the node graph (usually for updates from remote users where datastore is already modified)
// 'full' = update both the graph nodes and the datastore (usually for local modifications)
export type UpdateMode = 'graphOnly' | 'full';

export abstract class AbstractCommand<ParamsType extends {} = {}, ReturnType = void, CacheType extends {} = {}>
{
    public cache: CacheType;

    constructor(public readonly params: ParamsType)
    {
        this.cache = {} as CacheType;
    }

    public static commandName = 'Untitled';

    public abstract exec(): ReturnType;
    public abstract undo(): void;

    public get name(): CommandName
    {
        return (Object.getPrototypeOf(this).constructor as {commandName: string}).commandName as CommandName;
    }

    public get canUndo()
    {
        return true;
    }

    public get isTracked()
    {
        // whether or not this command ends up in undoStack, or whether it just does something outside of the stack
        return false;
    }

    public redo()
    {
        return this.exec();
    }

    public get app()
    {
        return Application.instance;
    }

    public get datastore()
    {
        return this.app.datastore;
    }

    public toJSON()
    {
        return {
            $: this.name,
            ...this.params,
        };
    }
}
