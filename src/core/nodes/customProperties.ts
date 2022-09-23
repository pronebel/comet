import type { ClonableNode } from './abstract/clonableNode';
import type { Clonable } from './cloneInfo';
import { CloneInfo, CloneMode } from './cloneInfo';
import { newGraphNodeId } from './factory';

export type CustomPropertyType = 'string' | 'number' | 'boolean';
export type CustomPropertyValueType = string | number | boolean;

export class CustomProperty
{
    public creator: ClonableNode;
    public name: string;
    public type: CustomPropertyType;
    public value: CustomPropertyValueType;

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

    constructor(creator: ClonableNode, name: string, type: CustomPropertyType, value: CustomPropertyValueType)
    {
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

export class CustomProperties<C extends ClonableNode> implements Clonable
{
    public id: string;
    public cloneInfo: CloneInfo;
    public properties: Map<string, CustomProperty[]>;
    public assignments: Map<string, string>;

    constructor(cloneInfo: CloneInfo = new CloneInfo())
    {
        this.id = newGraphNodeId('CustomProperties', true);
        this.properties = new Map();
        this.cloneInfo = cloneInfo;
        this.assignments = new Map();
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

    public set(creator: C, customKey: string, type: CustomPropertyType, value: CustomPropertyValueType)
    {
        if (!this.properties.has(customKey))
        {
            this.properties.set(customKey, []);
        }

        let property = new CustomProperty(creator, customKey, type, value);

        const array = this.properties.get(customKey);

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

        this.cloneInfo.forEachCloned<CustomProperties<C>>((customProps) =>
        {
            customProps.onClonerSetCustomProperty(property);
        });

        return property;
    }

    public remove(creator: C, customKey: string)
    {
        const array = this.properties.get(customKey);

        if (array)
        {
            const toRemove: CustomProperty[] = [];

            array.forEach((property) =>
            {
                if (property.creator === creator)
                {
                    toRemove.push(property);

                    this.cloneInfo.forEachCloned<CustomProperties<C>>((customProps) =>
                    {
                        customProps.onClonerRemoveCustomProperty(property);
                    });
                }
            });

            this.properties.set(customKey, array.filter((property) => toRemove.indexOf(property) === -1));
        }
    }

    public onClonerSetCustomProperty(property: CustomProperty)
    {
        this.set(property.creator as C, property.name, property.type, property.value);
    }

    public onClonerRemoveCustomProperty(property: CustomProperty)
    {
        this.remove(property.creator as C, property.name);
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

        this.assignments.forEach((value, key) => clone.assignments.set(key, value));

        return clone;
    }

    public unlink(newCreator: C)
    {
        this.cloneInfo.unlink(this);

        this.keys().forEach((key) =>
        {
            const array = this.get(key);

            if (array && array.length > 0)
            {
                const firstElement = array[0];
                const property = CustomProperty.copy(firstElement);

                property.creator = newCreator;

                this.properties.set(key, [property]);
            }
        });

        const assignments = newCreator.customProperties.assignments;

        assignments.forEach((value: string, key: string) => this.assignments.set(key, value));

        return this;
    }

    public assign(modelKey: string, customPropertyKey: string)
    {
        this.assignments.set(modelKey, customPropertyKey);
    }

    public unAssign(modelKey: string)
    {
        this.assignments.delete(modelKey);
    }

    public getAssignedPropertyForModelKey(modelKey: string): CustomProperty | undefined
    {
        const customKey = this.assignments.get(modelKey);

        if (customKey)
        {
            const array = this.properties.get(customKey);

            if (array && array.length > 0)
            {
                return array[0];
            }
        }

        return undefined;
    }

    public getAssignedModelKeyForCustomKey(customKey: string)
    {
        for (const [modelKey, ck] of this.assignments.entries())
        {
            if (ck === customKey)
            {
                return modelKey;
            }
        }

        return undefined;
    }

    public hasAssignedToModelKey(modelKey: string)
    {
        return this.assignments.has(modelKey);
    }
}
