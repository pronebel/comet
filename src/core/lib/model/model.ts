import EventEmitter from 'eventemitter3';

import type { ModelSchema } from './schema';

export class Model<M extends object> extends EventEmitter<'modified'>
{
    public parent?: Model<M>;
    public children: Model<M>[];
    public schema: ModelSchema<M>;
    public data: Partial<M>;

    constructor(schema: ModelSchema<M>, data: Partial<M>)
    {
        super();
        this.schema = schema;
        this.data = data;
        this.children = [];
    }

    public get values(): M
    {
        const { schema: { keys, keys: { length: l } } } = this;
        const values: M = {} as M;

        for (let i = 0; i < l; i++)
        {
            const key = keys[i];

            const value = this.getValue(key);

            values[key] = value;
        }

        return values;
    }

    public get ownValues(): M
    {
        const { schema: { keys, keys: { length: l } } } = this;
        const values: M = {} as M;

        for (let i = 0; i < l; i++)
        {
            const key = keys[i];

            const value = (this as unknown as M)[key];

            values[key] = value;
        }

        return values;
    }

    public setValues(values: Partial<M>)
    {
        const keys = Object.getOwnPropertyNames(values) as (keyof M)[];

        keys.forEach((key) =>
        {
            (this as unknown as Partial<M>)[key] = values[key];
        });
    }

    public getValue<T extends M[keyof M]>(key: keyof M): T
    {
        const { parent, schema: { defaults } } = this;
        const value = (this as unknown as M)[key];

        if (value === undefined)
        {
            if (parent)
            {
                return parent.getValue(key);
            }

            return defaults[key] as T;
        }

        return value as T;
    }

    public flatten()
    {
        if (!this.parent)
        {
            return;
        }

        const { schema: { keys, keys: { length: l } } } = this;

        for (let i = 0; i < l; i++)
        {
            const key = keys[i];

            const value = this.getValue(key);

            (this as unknown as M)[key] = value;
        }
    }

    public removeChild(model: Model<M>)
    {
        const index = this.children.indexOf(model);

        if (index > -1)
        {
            this.children.splice(index, 1);
        }
        else
        {
            throw new Error('"Cannot remove a model which is not in children"');
        }
    }

    public reset()
    {
        const { schema: { keys, keys: { length: l } } } = this;

        for (let i = 0; i < l; i++)
        {
            const key = keys[i];

            delete this.data[key];
        }

        this.emit('modified');
    }

    public onModified(key: keyof M, value: M[keyof M], oldValue: M[keyof M])
    {
        this.emit('modified', key, value, oldValue);

        this.children.forEach((childModel) => childModel.onModified(key, value, oldValue));
    }
}

export function createModel<M extends object>(schema: ModelSchema<M>, props: Partial<M>): Model<M> & M
{
    const data: Partial<M> = {
        ...props,
    };

    const { keys } = schema;

    const model = new Model(schema, data) as Model<M> & M;

    const propHash = keys.reduce((map, obj) =>
    {
        map[String(obj)] = true;

        return map;
    }, {} as {[k: string]: boolean});

    keys.forEach((key) =>
    {
        Object.defineProperty(model, key, {
            get<T>()
            {
                return Reflect.get(data, key) as T;
            },
            set<T>(newValue: T)
            {
                let oldValue = Reflect.get(data, key) as T;

                if (oldValue === undefined)
                {
                    oldValue = model.getValue(key) as unknown as T;
                }

                let value = newValue === undefined ? props[key] : newValue;

                const constrains = schema.constraints[key];

                if (constrains)
                {
                    constrains.forEach((constraint) =>
                    {
                        value = constraint.applyToValue(value);
                    });
                }

                const rtn = Reflect.set(data, key, value);

                if (propHash[String(key)])
                {
                    model.onModified(key, value as M[keyof M], oldValue as unknown as M[keyof M]);
                }

                return rtn;
            },
        });
    });

    return model;
}
