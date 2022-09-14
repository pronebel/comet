import { version } from '../../../../package.json';
import type { ModelValue } from '../../../core/lib/model/model';
import type { CloneMode } from '../../../core/lib/node/cloneInfo';
import type { CustomPropertyType } from '../../../core/lib/node/customProperties';

export type id = string;

export interface NodeSchema
{
    model: Record<string, ModelValue>;
    cloneInfo: {
        cloneMode: CloneMode;
        cloner: id;
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

export const defaultProject = () => ({
    name: 'untitled',
    version,
    nodes: {},
    hierarchy: {},
} as ProjectSchema);
