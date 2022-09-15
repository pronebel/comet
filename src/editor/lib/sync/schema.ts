import { version } from '../../../../package.json';
import type { ModelValue } from '../../../core/lib/model/model';
import { CloneMode } from '../../../core/lib/nodes/cloneInfo';
import type { CustomPropertyType } from '../../../core/lib/nodes/customProperties';
import { newNodeId } from '../../../core/lib/nodes/factory';
import { getUserName } from './user';

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
    createdBy: string;
    nodes: Record<string, NodeSchema>;
    hierarchy: Record<id /** parentId */, id /** childId */>;
    root?: string;
}

export function createProject(name: string): ProjectSchema
{
    return {
        name,
        version,
        createdBy: getUserName(),
        nodes: { },
        hierarchy: { },
    };
}

export function createNode(type: string, id?: string): NodeSchema
{
    return {
        id: id ?? newNodeId(type),
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
