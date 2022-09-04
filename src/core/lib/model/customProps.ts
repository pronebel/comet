import EventEmitter  from 'eventemitter3';

import { CloneInfo, CloneMode } from '../clone';
import type { AnyComponent } from '../component';

export type CustomPropertyType = 'string' | 'number' | 'boolean';

export class CustomProperty extends EventEmitter<'modified'>
{
    public creator: AnyComponent;
    public name: string;
    public type: CustomPropertyType;
    public value: any;

    public static copy(property: CustomProperty)
    {
        const copy = new CustomProperty(
            property.creator,
            property.name,
            property.type,
            property.value,
        );

        return copy;
    }

    constructor(creator: AnyComponent, name: string, type: CustomPropertyType, value: any)
    {
        super();

        this.creator = creator;
        this.name = name;
        this.type = type;
        this.value = value;
    }

    public copy(property: CustomProperty)
    {
        this.creator = property.creator;
        this.name = property.name;
        this.type = property.type;
        this.value = property.value;
    }
}

export class CustomProperties extends EventEmitter
{
    public cloneInfo: CloneInfo<CustomProperties>;
    public properties: Map<string, CustomProperty[]>;

    constructor(cloneInfo: CloneInfo<CustomProperties> = new CloneInfo())
    {
        super();

        this.properties = new Map();
        this.cloneInfo = cloneInfo;
    }

    public get hasDefinitions()
    {
        return this.properties.size > 0;
    }

    public keys()
    {
        return Array.from(this.properties.keys());
    }

    public values()
    {
        return Array.from(this.properties.values());
    }

    public get(name: string)
    {
        if (!this.properties.has(name))
        {
            throw new Error(`"Custom property with name '${name}' not found.`);
        }

        return this.properties.get(name);
    }

    public addProperty(property: CustomProperty)
    {
        const { name } = property;

        if (!this.properties.has(name))
        {
            this.properties.set(name, []);
        }

        const array = this.properties.get(name);

        if (array)
        {
            array.push(property);
        }
    }

    public define(creator: AnyComponent, name: string, type: CustomPropertyType, value: any)
    {
        if (!this.properties.has(name))
        {
            this.properties.set(name, []);
        }

        let property = new CustomProperty(creator, name, type, value);

        const array = this.properties.get(name);

        if (array)
        {
            if (array.length > 0)
            {
                const existingProperty = array.find((property) => property.creator === creator);

                if (existingProperty)
                {
                    existingProperty.copy(property);

                    property = existingProperty;
                }
                else
                {
                    array.splice(0, 0, property);
                }
            }
            else
            {
                array.push(property);
            }
        }

        this.cloneInfo.cloned.forEach((customProps) =>
        {
            customProps.onSpawnerDefined(property);
        });

        return property;
    }

    public unDefine(creator: AnyComponent, name: string)
    {
        const array = this.properties.get(name);

        if (array)
        {
            const toRemove: CustomProperty[] = [];

            array.forEach((property) =>
            {
                if (property.creator === creator)
                {
                    toRemove.push(property);

                    this.cloneInfo.cloned.forEach((customProps) =>
                    {
                        customProps.onSpawnerUnDefined(property);
                    });
                }
            });

            this.properties.set(name, array.filter((property) => toRemove.indexOf(property) === -1));
        }
    }

    public onSpawnerDefined(property: CustomProperty)
    {
        this.define(property.creator, property.name, property.type, property.value);
    }

    public onSpawnerUnDefined(property: CustomProperty)
    {
        this.unDefine(property.creator, property.name);
    }

    public clone()
    {
        const clone = new CustomProperties(new CloneInfo(CloneMode.Variant, this));

        this.cloneInfo.cloned.push(clone);

        this.keys().forEach((key) =>
        {
            const array = this.get(key);

            if (array)
            {
                clone.properties.set(key, [...array]);
            }
        });

        return clone;
    }

    public unlink(creator: AnyComponent)
    {
        this.cloneInfo.unlink();

        this.keys().forEach((key) =>
        {
            const array = this.get(key);

            if (array)
            {
                const firstElement = array[0];
                const property = CustomProperty.copy(firstElement);

                property.creator = creator;

                this.properties.set(key, [property]);
            }
        });
    }
}
