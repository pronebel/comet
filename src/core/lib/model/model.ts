import EventEmitter from 'eventemitter3';

import type { Component } from '../component';
import { project } from '../project';
import type { ModelSchema } from './schema';

let id = 1;

export class Model<M extends object> extends EventEmitter<'modified'>
{
    public id: string;
    public parent?: Model<M>;
    public children: Model<M>[];
    public schema: ModelSchema<M>;
    public data: Partial<M>;
    public customProperties: Map<string, any>;
    public customPropertyAssignments: Map<keyof M, {
        name: string;
        previousValue: any;
    }>;

    public isReference: boolean;
    public component?: Component<M, any>;

    constructor(schema: ModelSchema<M>, data: Partial<M>)
    {
        super();

        this.id = `Model:${id++}`;
        this.schema = schema;
        this.data = data;
        this.children = [];
        this.customProperties = new Map();
        this.customPropertyAssignments = new Map();
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

    public getAssignedCustomPropertyValue(key: keyof M): unknown
    {
        const { parent, customProperties, customPropertyAssignments } = this;

        const property = customPropertyAssignments.get(key);

        if (property)
        {
            return customProperties.get(property.name);
        }

        if (parent)
        {
            return parent.getAssignedCustomPropertyValue(key);
        }

        return undefined;
    }

    public getValue<T extends M[keyof M]>(key: keyof M): T
    {
        const { data, parent, schema: { defaults } } = this;

        const customPropertyModelValue = this.getAssignedCustomPropertyValue(key);

        if (customPropertyModelValue !== undefined)
        {
            return customPropertyModelValue as T;
        }

        const value = (data as M)[key];

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

            this.children.forEach((childModel) => childModel.rawSetValue(key, value));
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

    public removeChild(model: Model<M>)
    {
        const index = this.children.indexOf(model);

        if (index > -1)
        {
            this.children.splice(index, 1);
            model.parent = undefined;
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

    public setCustomProperty<T>(name: string, value: T)
    {
        this.customProperties.set(name, value);
    }

    public removeCustomProperty(name: string)
    {
        this.customProperties.delete(name);
        const modelKey = this.getModelKeyForCustomPropertyAssignment(name);

        if (modelKey)
        {
            this.unassignCustomProperty(modelKey);
        }
    }

    public getModelKeyForCustomPropertyAssignment(customPropertyName: string)
    {
        const modelKeys = Array.from(this.customPropertyAssignments.keys());

        for (let i = 0; i < modelKeys.length; i++)
        {
            if (this.customPropertyAssignments.get(modelKeys[i])?.name === customPropertyName)
            {
                return modelKeys[i];
            }
        }

        return undefined;
    }

    public assignCustomProperty(modelKey: keyof M, customPropertyName: string)
    {
        const previousValue = this.data[modelKey];

        let value = this.customProperties.get(customPropertyName) || project.customProperties.get(customPropertyName);

        if (value === undefined)
        {
            let ref = this.component;

            while (ref)
            {
                if (ref.model.customProperties.has(customPropertyName))
                {
                    value = ref.model.customProperties.get(customPropertyName);
                }
                ref = ref.parent;
            }
        }

        if (value === undefined)
        {
            throw new Error(`"Cannot find custom property with name "${customPropertyName}"`);
        }

        this.customPropertyAssignments.set(modelKey, {
            name: customPropertyName,
            previousValue,
        });

        this.setValue(modelKey, value);
    }

    public unassignCustomProperty(modelKey: keyof M)
    {
        const property = this.customPropertyAssignments.get(modelKey);

        this.customPropertyAssignments.delete(modelKey);

        if (property)
        {
            this.setValue(modelKey, property.previousValue || this.schema.defaults[modelKey]);
        }
    }

    public getCustomPropertyNames()
    {
        return Array.from(this.customProperties.keys());
    }

    public getCustomPropertyType(name: string)
    {
        return typeof this.customProperties.get(name);
    }

    public getReferenceParent(): Model<M> | undefined
    {
        if (this.isReference)
        {
            if (this.parent)
            {
                return this.parent.getReferenceParent();
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
