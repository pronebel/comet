import { version } from '../../../../package.json';
import type { ModelBase, ModelValue } from '../../../core/lib/model/model';
import type { ClonableNode } from '../../../core/lib/nodes/abstract/clonableNode';
import { CloneMode } from '../../../core/lib/nodes/cloneInfo';
import type { CustomPropertyType } from '../../../core/lib/nodes/customProperties';
import { newGraphNodeId } from '../../../core/lib/nodes/factory';
import { getUserName } from './user';

export type id = string;

export interface CustomPropSchema
{
    type: CustomPropertyType;
    value: ModelValue;
}

export interface NodeSchema<M extends ModelBase>
{
    id: string;
    type: string;
    parent?: string;
    model: Partial<M>;
    cloneInfo: {
        cloneMode: CloneMode;
        cloner?: id;
        cloned: id[];
    };
    customProperties: {
        defined: Record<string, CustomPropSchema[]>;
        assigned: Record<string, string>;
    };
}

export interface ProjectSchema
{
    name: string;
    version: string;
    createdBy: string;
    nodes: Record<string, NodeSchema<any>>;
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
    parent?: string;
}

export function createProjectSchema(name: string): ProjectSchema
{
    const project = createNodeSchema('Project');
    const scene = createNodeSchema('Scene', { parent: project.id });

    return {
        name,
        version,
        createdBy: getUserName(),
        nodes: {
            [project.id]: project,
            [scene.id]: scene,
        },
    };
}

export function createNodeSchema<M extends ModelBase>(type: string, nodeOptions: NodeOptionsSchema<M> = {}): NodeSchema<M>
{
    const { id, model, cloneInfo: { cloner, cloneMode, cloned } = {}, parent } = nodeOptions;

    return {
        id: id ?? newGraphNodeId(type),
        type,
        parent,
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

export function getNodeSchema(node: ClonableNode)
{
    const { cloner, cloneMode, cloned } = node.cloneInfo;

    const nodeSchema = createNodeSchema(node.nodeType(), {
        id: node.id,
        parent: node.parent?.id,
        model: node.model.ownValues,
        cloneInfo: {
            cloner: cloner?.id,
            cloneMode,
            cloned: cloned.map((node) => node.id),
        },
    });

    node.customProperties.properties.forEach((value, key) =>
    {
        const props = value.map((customProp) => ({
            type: customProp.type,
            value: customProp.value,
        }));

        nodeSchema.customProperties.defined[key] = props;
    });

    node.customProperties.assignments.forEach((customKey, modelKey) =>
    {
        nodeSchema.customProperties.assigned[modelKey] = customKey;
    });

    return nodeSchema;
}
