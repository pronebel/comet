import { type DisplayObject, Container } from 'pixi.js';

import type { ModelSchema } from '../../../core/model/schema';
import { type ContainerModel, ContainerNode, containerSchema } from '../../../core/nodes/concrete/container';
import { createPivotShape } from '../../ui/transform/const';

export const yellowPivot = createPivotShape({
    radius: 7,
    lineColor: 0xffff00,
    bgColor: 0xffffff,
    bgAlpha: 0.1,
    crosshairSize: 12,
});

export class EmptyNode extends ContainerNode<ContainerModel, Container>
{
    public nodeType()
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

        container.addChild(yellowPivot);

        return container;
    }
}

