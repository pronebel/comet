import { type DisplayObject, Container } from 'pixi.js';

import type { ModelSchema } from '../../../core/model/schema';
import { type ContainerModel, ContainerNode, containerSchema } from '../../../core/nodes/concrete/container';
import { createPivotShape } from '../../ui/transform/const';

const radius = 10;

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

        const yellowPivot = createPivotShape({
            radius,
            lineColor: 0xffff00,
            bgColor: 0xffffff,
            bgAlpha: 0.1,
            crosshairSize: 8,
        });

        container.addChild(yellowPivot);

        // const bounds = yellowPivot.getLocalBounds();

        // adjust to fit
        // yellowPivot.x = bounds.width - (radius * 2);
        // yellowPivot.y = bounds.height - (radius * 2);

        return container;
    }
}

