import { version } from '../../../../package.json';
import type { ModelBase, ModelValue } from '../../../core/lib/model/model';
import { CloneMode } from '../../../core/lib/nodes/cloneInfo';
import type { CustomPropertyType } from '../../../core/lib/nodes/customProperties';
import { newGraphNodeId } from '../../../core/lib/nodes/factory';
import { getUserName } from './user';

export type id = string;

export interface NodeSchema<M extends ModelBase>
{
    id: string;
    type: string;
    model: Partial<M>;
    cloneInfo: {
        cloneMode: CloneMode;
        cloner?: id;
        cloned: id[];
    };
    customProperties: {
        defined: Record<string, {
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
    nodes: Record<string, NodeSchema<any>>;
    hierarchy: Record<id /** parentId */, id /** childId */>;
}

export interface CloneInfoSchema
{
    cloner?: id;
    cloneMode: CloneMode;
    cloned: id[];
}

export interface NodeOptionsSchema<M extends ModelBase>
{
    id?: string;
    model?: Partial<M>;
    cloneInfo?: CloneInfoSchema;
}

export function createProjectSchema(name: string): ProjectSchema
{
    const project = createNodeSchema('Project');
    const scene = createNodeSchema('Scene');

    return {
        name,
        version,
        createdBy: getUserName(),
        nodes: {
            [project.id]: project,
            [scene.id]: scene,
        },
        hierarchy: {
            [project.id]: scene.id,
        },
    };
}

export function createNodeSchema<M extends ModelBase>(type: string, nodeOptions: NodeOptionsSchema<M> = {}): NodeSchema<M>
{
    const { id, model, cloneInfo: { cloner, cloneMode, cloned } = {} } = nodeOptions;

    return {
        id: id ?? newGraphNodeId(type),
        type,
        model: model ?? {},
        cloneInfo: {
            cloner,
            cloneMode: cloneMode ?? CloneMode.Original,
            cloned: cloned ?? [],
        },
        customProperties: {
            defined: {},
            assigned: {},
        },
    };
}
