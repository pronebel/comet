import { type DisplayObject, Container } from 'pixi.js';

import type { ModelSchema } from '../model/schema';
import type { ContainerModel } from './container';
import { ContainerComponent, schema as containerSchema } from './container';

export class GroupComponent extends ContainerComponent<ContainerModel, Container>
{
    public modelSchema(): ModelSchema<ContainerModel>
    {
        return containerSchema;
    }

    public createView(): Container<DisplayObject>
    {
        return new Container();
    }
}
