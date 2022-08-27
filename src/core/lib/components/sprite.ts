import type { Container } from 'pixi.js';
import { Sprite, Texture } from 'pixi.js';

import { type ModelSchema, createModelSchema } from '../model/schema';
import { setParent } from '../util/transform';
import { type DisplayObjectModel, DisplayObjectComponent, schema as DisplayObjectSchema } from './displayObject';

export interface SpriteModel extends DisplayObjectModel
{
    width: number;
    height: number;
    tint: number;
}

export const schema = createModelSchema<SpriteModel>({
    ...DisplayObjectSchema.defaults,
    width: 0,
    height: 0,
    tint: 0xffffff,
}, {
    ...DisplayObjectSchema.constraints,
});

export class SpriteComponent extends DisplayObjectComponent<SpriteModel, Sprite>
{
    public modelSchema(): ModelSchema<SpriteModel>
    {
        return schema;
    }

    public createView(): Sprite
    {
        const sprite = new Sprite(Texture.WHITE);

        return sprite;
    }

    public updateView(): void
    {
        const { tint, width, height } = this.model.values;

        this.view.tint = tint;

        this.view.width = width;
        this.view.height = height;

        super.updateView();
    }

    protected onAddedToParent(): void
    {
        if (this.parent)
        {
            const thisView = this.view;
            const parentView = this.parent.getView<Container>();

            setParent(thisView, parentView);
        }
    }
}
