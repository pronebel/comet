export type CustomProperties = Map<string, CustomProperty<any>>;

export type CustomPropertyType = 'string' | 'number' | 'boolean';

export class CustomProperty<T>
{
    public name: string;
    public value: T;

    constructor(name: string, value: T)
    {
        this.name = name;
        this.value = value;
    }
}
