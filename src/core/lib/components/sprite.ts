import { Sprite, Texture } from 'pixi.js';

import { ModelSchema } from '../model/schema';
import { type ContainerModel, ContainerComponent, containerSchema } from './container';

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

export class SpriteComponent<M extends SpriteModel, V extends Sprite> extends ContainerComponent<M, V>
{
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
        const { view, values: { anchorX, anchorY, tint } } = this;

        super.updateView();

        view.anchor.x = anchorX;
        view.anchor.y = anchorY;
        view.tint = tint;
    }
}
