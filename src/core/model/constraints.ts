export abstract class ModelConstraint<T>
{
    public abstract applyToValue(value: T): T;
}

export class NumericRangeLimitConstraint extends ModelConstraint<number>
{
    public min: number;
    public max: number;

    constructor(min: number, max: number)
    {
        super();
        this.min = min;
        this.max = max;
    }

    public applyToValue(value: number): number
    {
        const { min, max } = this;

        return Math.min(max, Math.max(min, value));
    }
}

export type ModelConstraints<M extends object> = Partial<Record<keyof M, ModelConstraint<any>[]>>;
