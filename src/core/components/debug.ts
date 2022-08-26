import { Sprite, Texture } from 'pixi.js';

import { Component } from '../component';
import { NumericRangeLimitConstraint } from '../model/constraints';
import { type ModelSchema, createModelSchema } from '../model/schema';

export interface DebugModel
{
    id: string;
    color: number;
    x: number;
    y: number;
    width: number;
    height: number;
    alpha: number;
}

export const schema = createModelSchema<DebugModel>({
    id: 'debug',
    color: 0xff0000,
    x: 0,
    y: 0,
    width: 20,
    height: 20,
    alpha: 1,
}, {
    width: [new NumericRangeLimitConstraint(10, 50)],
});

export class DebugComponent extends Component<typeof schema.defaults, Sprite>
{
    public modelSchema(): ModelSchema<DebugModel>
    {
        return schema;
    }

    public createView(): Sprite
    {
        return new Sprite(Texture.WHITE);
    }

    public updateView(): void
    {
        const { color, x, y, width, height, alpha } = this.model.values;

        this.view.tint = color;
        this.view.x = x;
        this.view.y = y;
        this.view.width = width;
        this.view.height = height;
        this.view.alpha = alpha;
    }
}
