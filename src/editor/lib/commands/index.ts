import { Application } from '../application';

export abstract class Command<T extends {} = {}>
{
    constructor(public readonly params: T)
    {

    }

    public abstract name: string;
    public abstract apply(): void;
    public abstract undo(): void;

    public redo()
    {
        return this.apply();
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
