export type CustomPropertyType = 'string' | 'number' | 'boolean';
export type CustomPropertyValueType = string | number | boolean;

export interface CustomProperty
{
    name: string;
    type: CustomPropertyType;
    value?: CustomPropertyValueType;
}
