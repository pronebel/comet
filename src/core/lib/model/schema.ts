import type { ModelConstraints } from './constraints';

export class ModelSchema<M extends object>
{
    public keys: (keyof M)[];
    public defaults: M;
    public constraints: ModelConstraints<M>;

    constructor(defaults: M, constraints: ModelConstraints<M> = {})
    {
        this.keys = Object.getOwnPropertyNames(defaults) as (keyof M)[];
        this.defaults = defaults;
        this.constraints = constraints;
    }
}
