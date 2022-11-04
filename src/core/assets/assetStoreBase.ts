export abstract class AssetStoreBase
{
    public abstract init(): Promise<void>;
    public abstract upload(): Promise<void>;
    public abstract download(): Promise<void>;
    public abstract delete(): Promise<void>;
}
