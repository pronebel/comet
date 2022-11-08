export abstract class StorageProvider
{
    public abstract init(): Promise<void>;
    public abstract upload(blob: Blob): Promise<string>;
    public abstract download(storageKey: string): Promise<Blob>;
    public abstract delete(storageKey: string): Promise<void>;
}
