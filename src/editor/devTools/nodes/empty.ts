import { type DisplayObject, Container } from 'pixi.js';

import { ModelSchema } from '../../../core/model/schema';
import { displayObjectSchema } from '../../../core/nodes/abstract/displayObject';
import { type ContainerModel, ContainerNode } from '../../../core/nodes/concrete/container';
import { createPivotShape } from '../../ui/transform/util';

const radius = 10;

export const emptySchema = new ModelSchema<ContainerModel>({
    ...displayObjectSchema.defaults,
    pivotX: radius,
    pivotY: radius,
}, displayObjectSchema.constraints);

export class EmptyNode extends ContainerNode<ContainerModel, Container>
{
    public get naturalWidth(): number
    {
        return radius * 2;
    }

    public get naturalHeight(): number
    {
        return radius * 2;
    }

    public nodeType()
    {
        return 'Empty';
    }

    public modelSchema(): ModelSchema<ContainerModel>
    {
        return emptySchema;
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
            showCircle: false,
        });

        yellowPivot.x = radius;
        yellowPivot.y = radius;

        container.addChild(yellowPivot);

        return container;
    }
}

