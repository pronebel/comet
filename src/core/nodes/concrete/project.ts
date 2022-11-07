import type { Container } from 'pixi.js';

import { ModelSchema } from '../../model/schema';
import { MetaNode } from '../abstract/metaNode';
import { type ContainerModel, containerSchema } from './container';

export type ProjectModel = ContainerModel;

export const projectSchema = new ModelSchema<ProjectModel>({
    ...containerSchema.defaults,

}, containerSchema.constraints);

export class ProjectNode extends MetaNode<ProjectModel, Container>
{
    public nodeType()
    {
        return 'Project';
    }
}

