export type CustomPropertyType = 'string' | 'number' | 'boolean';
export type CustomPropertyValueType = string | number | boolean;

export interface CustomProperty
{
    type: CustomPropertyType;
    value?: CustomPropertyValueType;
}
