import { type DisplayObject, Container, Graphics, Text } from 'pixi.js';

import type { ModelSchema } from '../../model/schema';
import type { ContainerModel } from './container';
import { ContainerNode, containerSchema } from './container';

export class EmptyNode extends ContainerNode<ContainerModel, Container>
{
    public static nodeType()
    {
        return 'Empty';
    }

    public modelSchema(): ModelSchema<ContainerModel>
    {
        return containerSchema;
    }

    public updateView(): void
    {
        const view = this.view;

        super.updateView();

        const bounds = view.getLocalBounds();

        view.width = bounds.width;
        view.height = bounds.height;
    }

    public createView(): Container<DisplayObject>
    {
        const container = new Container();
        const graphics = new Graphics();

        container.addChild(graphics);

        graphics.lineStyle(1, 0xFEEB77, 1);
        graphics.beginFill(0x650A5A, 0.01);
        graphics.drawCircle(0, 0, 10);
        graphics.endFill();

        const label = new Text(this.id.replace('Node', ''), {
            fontSize: 10,
            fill: 0xffffff,
        });

        label.x = 15;
        label.y = -5;

        container.addChild(label);

        return container;
    }
}
