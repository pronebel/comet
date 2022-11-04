import type { Container } from 'pixi.js';

import { ModelSchema } from '../../model/schema';
import { MetaNode } from '../abstract/metaNode';
import { type ContainerEvents, type ContainerModel, containerSchema } from './container';

export type ProjectEvents = ContainerEvents;

export interface ProjectModel extends ContainerModel
{
    activeScene: string | null;
}

export const projectSchema = new ModelSchema<ProjectModel>({
    ...containerSchema.defaults,
    activeScene: null,

}, containerSchema.constraints);

export class ProjectNode extends MetaNode<ProjectModel, Container, ProjectEvents>
{
    private static readonly _instance: ProjectNode;

    public nodeType()
    {
        return 'Project';
    }

    public static get instance()
    {
        if (!ProjectNode._instance)
        {
            throw new Error('Project not defined');
        }

        return ProjectNode._instance;
    }
}

