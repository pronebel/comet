export enum SpawnMode
    {
    Original = 'original',
    Duplicate = 'duplicate',
    Variant = 'variant',
    ReferenceRoot = 'reference_root',
    Reference = 'reference',
}

export class SpawnInfo<C>
{
    public spawnMode: SpawnMode;
    public spawner?: C;
    public spawned: C[];

    constructor(spawnMode: SpawnMode = SpawnMode.Original, spawner?: C)
    {
        this.spawnMode = spawnMode;
        this.spawner = spawner;
        this.spawned = [];
    }

    public get spawnedCount()
    {
        return this.spawned.length;
    }

    public get wasSpawned()
    {
        return this.spawner !== undefined;
    }

    public get isOriginal()
    {
        return this.spawnMode === SpawnMode.Original;
    }

    public get isDuplicate()
    {
        return this.spawnMode === SpawnMode.Duplicate;
    }

    public get isVariant()
    {
        return this.spawnMode === SpawnMode.Variant;
    }

    public get isReferenceOrRoot()
    {
        return this.spawnMode === SpawnMode.Reference || this.spawnMode === SpawnMode.ReferenceRoot;
    }

    public get isReference()
    {
        return this.spawnMode === SpawnMode.Reference;
    }

    public get isReferenceRoot()
    {
        return this.spawnMode === SpawnMode.ReferenceRoot;
    }

    public getSpawnedAt(index: number)
    {
        return this.spawned[index];
    }

    public isSpawner(component: C)
    {
        return this.spawner === component;
    }

    public unlink()
    {
        delete this.spawner;
        this.spawnMode = SpawnMode.Original;
    }
}
