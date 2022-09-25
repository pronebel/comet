import type { CloneInfoSchema } from './schema';

export enum CloneMode
    {
    Original = 'original',
    Duplicate = 'duplicate',
    ReferenceRoot = 'reference_root',
    Reference = 'reference',
    VariantRoot = 'variant_root',
    Variant = 'variant',
}

export interface Clonable
{
    id: string;
    cloneInfo: CloneInfo;
}

export class CloneInfo
{
    public cloneMode: CloneMode;
    public cloner?: Clonable;
    public cloned: Clonable[];

    constructor(cloneMode: CloneMode = CloneMode.Original, cloner?: Clonable)
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

    public get isVariantRoot()
    {
        return this.cloneMode === CloneMode.VariantRoot;
    }

    public get isVariant()
    {
        return this.cloneMode === CloneMode.Variant || this.cloneMode === CloneMode.VariantRoot;
    }

    public get isReferenceOrRoot()
    {
        return this.cloneMode === CloneMode.Reference || this.cloneMode === CloneMode.ReferenceRoot;
    }

    public get isRoot()
    {
        return this.isReferenceRoot || this.isVariantRoot;
    }

    public get isReference()
    {
        return this.cloneMode === CloneMode.Reference;
    }

    public get isReferenceRoot()
    {
        return this.cloneMode === CloneMode.ReferenceRoot;
    }

    public get isCloned()
    {
        const { cloneMode } = this;

        return cloneMode === CloneMode.Reference || cloneMode === CloneMode.ReferenceRoot || cloneMode === CloneMode.Variant;
    }

    public getClonedAt<T>(index: number)
    {
        return this.cloned[index] as unknown as T;
    }

    public isClonedFrom(cloner: Clonable)
    {
        return this.cloner === cloner;
    }

    public unlink(owner: Clonable)
    {
        if (this.cloner)
        {
            this.cloner.cloneInfo.removeCloned(owner);
            delete this.cloner;
        }
        this.cloneMode = CloneMode.Original;
    }

    public removeCloned(cloned: Clonable)
    {
        const index = this.cloned.indexOf(cloned);

        if (index > -1)
        {
            this.cloned.splice(index, 1);
        }
    }

    public getCloner<T = unknown>()
    {
        return this.cloner as unknown as T;
    }

    public forEachCloned<T>(fn: (clone: T) => void)
    {
        this.cloned.forEach((cloned) => fn(cloned as unknown as T));
    }

    public toSchema(): CloneInfoSchema
    {
        const { cloner, cloneMode, cloned } = this;
        const clonerId = cloner ? cloner.id : undefined;
        const clonedSchema = cloned.map((node) => node.id);

        return {
            cloner: clonerId,
            cloneMode,
            cloned: clonedSchema,
        };
    }
}
