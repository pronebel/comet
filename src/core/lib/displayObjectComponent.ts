import type { DisplayObject } from 'pixi.js';

import { Component } from './component';
import { NumericRangeLimitConstraint } from './model/constraints';
import { ModelSchema } from './model/schema';

export interface DisplayObjectModel
{
    x: number;
    y: number;
    pivotX: number;
    pivotY: number;
    skewX: number;
    skewY: number;
    scaleX: number;
    scaleY: number;
    angle: number;
    alpha: number;
}

export const schema = new ModelSchema<DisplayObjectModel>({
    x: 0,
    y: 0,
    pivotX: 0,
    pivotY: 0,
    skewX: 1,
    skewY: 1,
    scaleX: 1,
    scaleY: 1,
    angle: 0,
    alpha: 1,
}, {
    alpha: [new NumericRangeLimitConstraint(0, 1)],
});

export abstract class DisplayObjectContainer<M extends DisplayObjectModel, V extends DisplayObject> extends Component<M, V>
{
    public modelSchema(): ModelSchema<M>
    {
        return schema as unknown as ModelSchema<M>;
    }

    public updateView(): void
    {
        const { view, model: { values: {
            x, y,
            pivotX, pivotY,
            scaleX, scaleY,
            angle,
            alpha,
        } } } = this;

        view.x = x;
        view.y = y;
        view.pivot.x = pivotX;
        view.pivot.y = pivotY;
        view.scale.x = scaleX;
        view.scale.y = scaleY;
        view.angle = angle;
        view.alpha = alpha;
    }

    public update()
    {
        if (this.view)
        {
            this.updateView();
        }
    }
}