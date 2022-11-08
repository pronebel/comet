import { newId } from '../nodes/instances';

export type AssetCacheKey = 'textures';

export abstract class Asset<P, R>
{
    public id: string;

    public storageKey: string;
    public name: string;
    public type: string;
    public size: number;
    public blob: Blob;
    public properties: P;
    public resources?: R;

    private static readonly cache: Record<AssetCacheKey, Map<string, Asset<any, any>>> = {
        textures: new Map(),
    };

    public static getCache(cacheKey: AssetCacheKey)
    {
        const cache = this.cache[cacheKey];

        if (!cache)
        {
            throw new Error(`Cannot find asset cache for key "${cacheKey}"`);
        }

        return cache;
    }

    public static async storeAsset(asset: Asset<any, any>)
    {
        this.getCache(asset.cacheKey).set(asset.id, asset);
    }

    public static hasAsset(cacheKey: AssetCacheKey, id: string)
    {
        const cache = this.getCache(cacheKey);

        return cache.has(id);
    }

    public static getAsset<T>(cacheKey: AssetCacheKey, id: string)
    {
        const cache = this.getCache(cacheKey);

        if (!cache.has(id))
        {
            throw new Error(`Asset "${id}" not defined`);
        }

        return cache.get(id) as unknown as T;
    }

    constructor(storageKey: string, name: string, type: string, size: number, blob: Blob)
    {
        this.id = newId('Asset');

        this.storageKey = storageKey;
        this.name = name;
        this.type = type;
        this.size = size;
        this.blob = blob;
        this.properties = {} as P;
    }

    get isResourceReady()
    {
        return !!this.resources;
    }

    abstract get cacheKey(): AssetCacheKey;

    public abstract getResource(): Promise<R>;
}
