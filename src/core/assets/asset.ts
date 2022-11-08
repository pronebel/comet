import { newId } from '../nodes/instances';

export type AssetCacheKey = 'textures';

export abstract class Asset<P, R>
{
    public id: string;

    public storageKey: string;
    public name: string;
    public mimeType: string;
    public size: number;
    public blob?: Blob;
    public properties: P;
    public resource?: R;

    constructor(id: string | undefined, storageKey: string, name: string, type: string, size: number, blob?: Blob)
    {
        this.id = id ?? newId('Asset');

        // primary metadata
        this.storageKey = storageKey;
        this.name = name;
        this.mimeType = type;
        this.size = size;
        this.blob = blob;

        // properties (subclass defined)
        this.properties = {} as P;
    }

    get isResourceReady()
    {
        return !!this.resource;
    }

    public abstract getResource(): Promise<R>;
}
