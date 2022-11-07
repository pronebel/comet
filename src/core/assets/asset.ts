import { newId } from '../nodes/instances';

export class Asset<T = {}>
{
    public id: string;

    public storageKey: string;
    public name: string;
    public type: string;
    public size: number;
    public blob: Blob;
    public properties: T;

    private static readonly cache: Map<string, Asset> = new Map();

    public static async store(asset: Asset)
    {
        this.cache.set(asset.id, asset);
    }

    public static get<T>(id: string)
    {
        if (!this.cache.has(id))
        {
            throw new Error(`Asset "${id}" not defined`);
        }

        return this.cache.get(id) as unknown as T;
    }

    constructor(storageKey: string, name: string, type: string, size: number, blob: Blob)
    {
        this.id = newId('Asset');

        this.storageKey = storageKey;
        this.name = name;
        this.type = type;
        this.size = size;
        this.blob = blob;
        this.properties = this.defaultProperties;
    }

    get defaultProperties(): T
    {
        return {} as T;
    }
}
