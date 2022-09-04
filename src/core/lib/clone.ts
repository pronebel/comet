export enum CloneMode
    {
    Original = 'original',
    Duplicate = 'duplicate',
    Variant = 'variant',
    ReferenceRoot = 'reference_root',
    Reference = 'reference',
}

export class CloneInfo<C>
{
    public cloneMode: CloneMode;
    public cloner?: C;
    public cloned: C[];

    constructor(cloneMode: CloneMode = CloneMode.Original, cloner?: C)
    {
        this.cloneMode = cloneMode;
        this.cloner = cloner;
        this.cloned = [];
    }

    public get clonedCount()
    {
        return this.cloned.length;
    }

    public get wasCloned()
    {
        return this.cloner !== undefined;
    }

    public get hasCloned()
    {
        return this.cloned.length > 0;
    }

    public get isOriginal()
    {
        return this.cloneMode === CloneMode.Original;
    }

    public get isDuplicate()
    {
        return this.cloneMode === CloneMode.Duplicate;
    }

    public get isVariant()
    {
        return this.cloneMode === CloneMode.Variant;
    }

    public get isReferenceOrRoot()
    {
        return this.cloneMode === CloneMode.Reference || this.cloneMode === CloneMode.ReferenceRoot;
    }

    public get isReference()
    {
        return this.cloneMode === CloneMode.Reference;
    }

    public get isReferenceRoot()
    {
        return this.cloneMode === CloneMode.ReferenceRoot;
    }

    public get isLinked()
    {
        const { cloneMode } = this;

        return cloneMode === CloneMode.Reference || cloneMode === CloneMode.ReferenceRoot || cloneMode === CloneMode.Variant;
    }

    public getClonedAt(index: number)
    {
        return this.cloned[index];
    }

    public isClonedFrom(component: C)
    {
        return this.cloner === component;
    }

    public unlink()
    {
        delete this.cloner;
        this.cloneMode = CloneMode.Original;
    }
}
