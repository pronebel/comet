import { Application } from './application';

export abstract class AbstractCommand<T extends {} = {}, R = void>
{
    constructor(public readonly params: T)
    {

    }

    public static commandName = 'Untitled';

    public abstract exec(): R;
    public abstract undo(): void;

    public get canUndo()
    {
        return true;
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
            $: (Object.getPrototypeOf(this).constructor as {commandName: string}).commandName,
            ...this.params,
        };
    }
}
