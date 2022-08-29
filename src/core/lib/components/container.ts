import type { Container } from 'pixi.js';

import { Component } from '../component';
import { NumericRangeLimitConstraint } from '../model/constraints';
import { ModelSchema } from '../model/schema';
import { degToRad } from '../util/geom';

export interface ContainerModel
{
    x: number;
    y: number;
    pivotX: number;
    pivotY: number;
    width: number;
    height: number;
    scaleX: number;
    scaleY: number;
    angle: number;
    alpha: number;
}

export const schema = new ModelSchema<ContainerModel>({
    x: 0,
    y: 0,
    pivotX: 0,
    pivotY: 0,
    width: 0,
    height: 0,
    scaleX: 1,
    scaleY: 1,
    angle: 0,
    alpha: 1,
}, {
    alpha: [new NumericRangeLimitConstraint(0, 1)],
});

export abstract class ContainerComponent<M extends ContainerModel, V extends Container> extends Component<M, V>
{
    public updateView(): void
    {
        const { view, model: { values: {
            x, y,
            pivotX, pivotY,
            width, height,
            scaleX, scaleY,
            angle,
            alpha,
        } } } = this;

        view.x = x;
        view.y = y;
        view.pivot.x = pivotX;
        view.pivot.y = pivotY;
        view.width = width;
        view.height = height;
        view.scale.x = scaleX;
        view.scale.y = scaleY;
        view.angle = degToRad(angle);
        view.alpha = alpha;
    }

    protected onAddedToParent(): void
    {
        if (this.parent)
        {
            const thisView = this.view;
            const parentView = this.parent.getView<Container>();

            parentView.addChild(thisView);
        }
    }

    protected onRemoveFromParent(): void
    {
        if (this.parent)
        {
            const thisView = this.view;
            const parentView = this.parent.getView<Container>();

            parentView.removeChild(thisView);
        }
    }
}
