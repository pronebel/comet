import { Document } from '../sync/document';

export abstract class Command
{
    public abstract apply(): void;
    public abstract undo(): void;

    protected get doc()
    {
        return Document.instance;
    }

    public redo()
    {
        this.apply();
    }

    public getCommandType(): string
    {
        return (Object.getPrototypeOf(this).constructor as {
            new (): object;
        }).name;
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
