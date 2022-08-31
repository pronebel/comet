import { type DisplayObject, Container, Graphics } from 'pixi.js';

import type { ModelSchema } from '../model/schema';
import type { ContainerModel } from './container';
import { ContainerComponent, schema as containerSchema } from './container';

export class EmptyComponent extends ContainerComponent<ContainerModel, Container>
{
    public modelSchema(): ModelSchema<ContainerModel>
    {
        return containerSchema;
    }

    public createView(): Container<DisplayObject>
    {
        const container = new Container();
        const graphics = new Graphics();

        container.addChild(graphics);
        graphics.lineStyle(2, 0xFEEB77, 1);
        graphics.beginFill(0x650A5A, 1);
        graphics.drawCircle(0, 0, 10);
        graphics.endFill();

        return container;
    }
}
