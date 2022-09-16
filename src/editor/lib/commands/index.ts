import { Application } from '../application';

export abstract class Command<T = void>
{
    public abstract name(): string;
    public abstract apply(): T;
    public abstract undo(): void;

    public redo(): T
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

    public toString()
    {
        return JSON.stringify(this.toJSON(), null, 4);
    }

    public toJSON()
    {
        const json: any = { };

        Object.getOwnPropertyNames(this).forEach((key) =>
        {
            json[key] = (this as any)[key];
        });

        return json as object;
    }
}
