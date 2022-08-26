import type { InteractionEvent } from 'pixi.js';
import { Sprite, Texture } from 'pixi.js';

import { app } from '../../../editor/lib/app';
import { startDrag } from '../../../editor/lib/drag';
import { Component } from '../component';
import { NumericRangeLimitConstraint } from '../model/constraints';
import { type ModelSchema, createModelSchema } from '../model/schema';

export interface DebugModel
{
    color: number;
    x: number;
    y: number;
    width: number;
    height: number;
    alpha: number;
}

export const schema = createModelSchema<DebugModel>({
    color: 0xff0000,
    x: 0,
    y: 0,
    width: 20,
    height: 20,
    alpha: 1,
}, {
    width: [new NumericRangeLimitConstraint(10, 50)],
});

export class DebugComponent extends Component<DebugModel, Sprite>
{
    public modelSchema(): ModelSchema<DebugModel>
    {
        return schema;
    }

    public createView(): Sprite
    {
        const sprite = new Sprite(Texture.WHITE);

        sprite.interactive = true;

        sprite.on('mousedown', (e: InteractionEvent) =>
        {
            app.select(this);
            startDrag(this);
            e.stopPropagation();
        });

        return sprite;
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

    protected onAddedToParent(): void
    {
        const parentView = this.parent?.view;

        if (parentView instanceof Sprite)
        {
            parentView.addChild(this.view);
        }
    }
}
