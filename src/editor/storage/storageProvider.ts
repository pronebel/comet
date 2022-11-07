export abstract class StorageProvider
{
    public abstract init(): Promise<void>;
    public abstract upload(blob: Blob): Promise<string>;
    public abstract download(id: string): Promise<Blob>;
    public abstract delete(id: string): Promise<void>;
}
