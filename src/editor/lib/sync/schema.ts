import { version } from '../../../../package.json';
import type { ModelValue } from '../../../core/lib/model/model';
import { CloneMode } from '../../../core/lib/node/cloneInfo';
import type { CustomPropertyType } from '../../../core/lib/node/customProperties';

export type id = string;

export interface NodeSchema
{
    id: string;
    type: string;
    model: Record<string, ModelValue>;
    cloneInfo: {
        cloneMode: CloneMode;
        cloner?: id;
        cloned: id[];
    };
    customProperties: {
        defined: Record<string, {
            name: string;
            type: CustomPropertyType;
            value: ModelValue;
        }>;
        assigned: Record<string, string>;
    };
}

export interface ProjectSchema
{
    name: string;
    version: string;
    nodes: Record<string, NodeSchema>;
    hierarchy: Record<id, id>;
}

export function createProject(name = 'untitled'): ProjectSchema
{
    return {
        name,
        version,
        nodes: {},
        hierarchy: {},
    };
}

export function createNode(type: string, id: string): NodeSchema
{
    return {
        id,
        type,
        model: {},
        cloneInfo: {
            cloneMode: CloneMode.Original,
            cloned: [],
        },
        customProperties: {
            defined: {},
            assigned: {},
        },
    };
}
