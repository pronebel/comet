import { Sprite, Texture } from 'pixi.js';

import { ModelSchema } from '../../model/schema';
import { type ContainerModel, ContainerNode, containerSchema } from './container';

export interface SpriteModel extends ContainerModel
{
    anchorX: number;
    anchorY: number;
    tint: number;
}

export const spriteSchema = new ModelSchema<SpriteModel>({
    ...containerSchema.defaults,
    anchorX: 0,
    anchorY: 0,
    tint: 0xffffff,
}, {
    ...containerSchema.constraints,
});

export class SpriteNode<M extends SpriteModel, V extends Sprite> extends ContainerNode<M, V>
{
    public nodeType()
    {
        return 'Sprite';
    }

    public modelSchema(): ModelSchema<M>
    {
        return spriteSchema as unknown as ModelSchema<M>;
    }

    public createView(): V
    {
        return new Sprite(Texture.WHITE) as V;
    }

    public updateView(): void
    {
        const { view, values: { anchorX, anchorY, tint, width, height } } = this;

        super.updateView();

        view.anchor.x = anchorX;
        view.anchor.y = anchorY;
        view.width = width;
        view.height = height;
        view.tint = tint;
    }
}
