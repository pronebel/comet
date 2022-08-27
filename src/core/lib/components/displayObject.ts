import type { DisplayObject } from 'pixi.js';

import { Component } from '../component';
import { NumericRangeLimitConstraint } from '../model/constraints';
import { createModelSchema } from '../model/schema';

export interface DisplayObjectModel
{
    x: number;
    y: number;

    alpha: number;
}

export const schema = createModelSchema<DisplayObjectModel>({
    x: 0,
    y: 0,

    alpha: 1,
}, {
    alpha: [new NumericRangeLimitConstraint(0, 1)],
});

export abstract class DisplayObjectComponent<M extends DisplayObjectModel, V extends DisplayObject> extends Component<M, V>
{
    public update()
    {
        super.update();
        this.updateTransform();
    }

    public updateView(): void
    {
        const { x, y, alpha } = this.model.values;

        this.view.alpha = alpha;

        const viewMatrix = this.view.worldTransform.clone();

        if (this.parent)
        {
            viewMatrix.a = viewMatrix.d = 1;
        }

        viewMatrix.tx = x;
        viewMatrix.ty = y;

        this.view.transform.setFromMatrix(viewMatrix);
    }

    public updateTransform()
    {
        if (this.parent)
        {
            // console.log(this.view.transform);
        }
    }
}
