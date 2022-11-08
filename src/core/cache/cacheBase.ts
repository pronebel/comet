export class CacheBase<T extends {id: string}>
{
    protected cache: Map<string, T>;

    public fetchProvider: (storageKey: string) => Promise<Blob>;

    constructor()
    {
        this.cache = new Map();

        // should be set by main app
        this.fetchProvider = () =>
        {
            throw new Error(`Fetch provider for ${this.type} cache undefined`);
        };
    }

    protected get type(): string
    {
        throw Error('Not implemented');
    }

    public add(item: T)
    {
        if (this.cache.has(item.id))
        {
            throw new Error(`${this.type} "${item.id}" already added`);
        }

        this.cache.set(item.id, item);
    }

    public has(id: string)
    {
        return this.cache.has(id);
    }

    public get(id: string)
    {
        if (!this.cache.has(id))
        {
            throw new Error(`${this.type} "${id}" not found`);
        }

        return this.cache.get(id) as T;
    }

    public fetch(storageKey: string): Promise<Blob>
    {
        return this.fetchProvider(storageKey);
    }
}
