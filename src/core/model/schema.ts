import type { ModelConstraints } from './constraints';

export interface ModelSchema<M extends object>
{
    keys: (keyof M)[];
    defaults: M;
    constraints: ModelConstraints<M>;
}

export function createModelSchema<M extends object>(defaults: M, constraints?: ModelConstraints<M>): ModelSchema<M>
{
    const keys = Object.getOwnPropertyNames(defaults) as (keyof M)[];

    return {
        keys,
        defaults,
        constraints: constraints ?? {} as ModelConstraints<M>,
    };
}
