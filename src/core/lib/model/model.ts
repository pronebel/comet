import type { NestableEvents } from '../nestable';
import { Nestable } from '../nestable';
import type { ModelSchema } from './schema';

let id = 1;

export class Model<M extends object> extends Nestable<NestableEvents | 'modified'>
{
    public id: string;
    public schema: ModelSchema<M>;
    public data: Partial<M>;

    public isReference: boolean;

    constructor(schema: ModelSchema<M>, data: Partial<M>)
    {
        super();

        this.id = `Model:${id++}`;
        this.schema = schema;
        this.data = data;
        this.children = [];
        this.isReference = false;

        this.setValues(data);
    }

    public link(sourceModel: Model<M>)
    {
        this.parent = sourceModel;
        sourceModel.children.push(this);
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
        const { data, schema: { keys, keys: { length: l } } } = this;
        const values: M = {} as M;

        for (let i = 0; i < l; i++)
        {
            const key = keys[i];

            const value = (data as unknown as M)[key];

            if (value !== undefined)
            {
                values[key] = value;
            }
        }

        return values;
    }

    public getValue<T extends M[keyof M]>(key: keyof M): T
    {
        const { data, parent, schema: { defaults } } = this;

        const value = (data as M)[key];

        if (value === undefined)
        {
            if (parent)
            {
                return (parent as Model<any>).getValue(key);
            }

            return defaults[key] as T;
        }

        return value as T;
    }

    public setValue<T>(key: keyof M, newValue: T)
    {
        const { data, schema, schema: { keys } } = this;

        let oldValue = Reflect.get(data, key) as T;

        if (oldValue === undefined)
        {
            oldValue = this.getValue(key) as unknown as T;
        }

        let value = newValue === undefined ? data[key] : newValue;

        const constraints = schema.getConstraints(key);

        if (constraints)
        {
            constraints.forEach((constraint) =>
            {
                value = constraint.applyToValue(value, String(key), this);
            });
        }

        const rtn = Reflect.set(data, key, value);

        if (keys.indexOf(key) > -1)
        {
            this.onModified(key, value as M[keyof M], oldValue as unknown as M[keyof M]);
        }

        return rtn;
    }

    public rawSetValue<T>(key: keyof M, newValue: T)
    {
        const { data, schema: { keys } } = this;

        let oldValue = Reflect.get(data, key) as T;

        if (oldValue === undefined)
        {
            oldValue = this.getValue(key) as unknown as T;
        }

        const value = newValue === undefined ? data[key] : newValue;

        const rtn = Reflect.set(data, key, value);

        if (keys.indexOf(key) > -1)
        {
            this.emit('modified', key, value, oldValue);

            this.children.forEach((childModel) => (childModel as Model<any>).rawSetValue(key, value));
        }

        return rtn;
    }

    public setValues(values: Partial<M>)
    {
        const keys = Object.getOwnPropertyNames(values) as (keyof M)[];

        keys.forEach((key) =>
        {
            this.setValue(key, values[key]);
        });
    }

    public flatten()
    {
        if (this.parent)
        {
            const { schema: { keys, keys: { length: l }, defaults } } = this;

            for (let i = 0; i < l; i++)
            {
                const key = keys[i];

                const value = this.getValue(key);

                if (value !== defaults[key])
                {
                    (this.data as M)[key] = value;
                }
            }

            this.parent.removeChild(this);
        }
    }

    public copy<T extends Model<M>>(): T
    {
        return createModel(this.schema, this.values) as unknown as T;
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

        this.forEach<Model<any>>((childModel) => childModel.onModified(key, value, oldValue));
        // this.children.forEach((childModel) => childModel.onModified(key, value, oldValue));
    }

    public getReferenceParent(): Model<M> | undefined
    {
        if (this.isReference)
        {
            if (this.parent)
            {
                return this.getParent<Model<any>>().getReferenceParent();
            }

            return this;
        }

        return undefined;
    }
}

export function createModel<M extends object>(
    schema: ModelSchema<M>,
    values: Partial<M> = {},
): Model<M> & M
{
    const { keys } = schema;

    const model = new Model(schema, values) as Model<M> & M;

    keys.forEach((key) =>
    {
        Object.defineProperty(model, key, {
            get<T>()
            {
                return this.getValue(key) as T;
            },
            set<T>(newValue: T)
            {
                return model.setValue(key, newValue);
            },
        });

        if (values[key] !== undefined)
        {
            model.setValue(key, values[key]);
        }
    });

    return model;
}
