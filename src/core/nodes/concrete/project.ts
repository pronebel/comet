import type { Container } from 'pixi.js';

import { ModelSchema } from '../../model/schema';
import { MetaNode } from '../abstract/metaNode';
import { type ContainerModel, containerSchema } from './container';

export interface ProjectModel extends ContainerModel
{
    activeScene: string | null;
}

export const projectSchema = new ModelSchema<ProjectModel>({
    ...containerSchema.defaults,
    activeScene: null,

}, containerSchema.constraints);

export class ProjectNode extends MetaNode<ProjectModel, Container>
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

