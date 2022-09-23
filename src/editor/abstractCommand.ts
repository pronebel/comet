import { Application } from './application';
import type { CommandName } from './commandFactory';

export abstract class AbstractCommand<T extends {} = {}, R = void>
{
    constructor(public readonly params: T)
    {

    }

    public static commandName = 'Untitled';

    public abstract exec(): R;
    public abstract undo(): void;

    public get name(): CommandName
    {
        return (Object.getPrototypeOf(this).constructor as {commandName: string}).commandName as CommandName;
    }

    public get canUndo()
    {
        return true;
    }

    public get isStandAlone()
    {
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
