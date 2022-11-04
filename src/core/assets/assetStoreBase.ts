export interface FileInfo {
    name: string;
    type: string;
    size: number;
}

export abstract class AssetStoreBase
{
    public abstract init(): Promise<void>;
    public abstract upload(blob: Blob, fileInfo: FileInfo): Promise<string>;
    public abstract download(id: string): Promise<{ blob: Blob, info: FileInfo }>;
    public abstract delete(id: string): Promise<void>;
}
