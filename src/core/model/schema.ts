import type { ModelConstraint, ModelConstraints } from './constraints';

export class ModelSchema<M>
{
    public keys: string[];
    public defaults: M;
    public constraints: ModelConstraints<M>;

    constructor(defaults: M, constraints: ModelConstraints<M> = {})
    {
        this.keys = Object.getOwnPropertyNames(defaults);
        this.defaults = defaults;
        this.constraints = constraints;
    }

    public getConstraints(key: keyof M)
    {
        const array: ModelConstraint<any>[] = [];

        if (this.constraints['*'])
        {
            array.push(...this.constraints['*']);
        }

        if (this.constraints[key])
        {
            const constraints = this.constraints[key] as ModelConstraint<any>[];

            array.push(...constraints);
        }

        return array;
    }
}
