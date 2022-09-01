import { Sprite, Texture } from 'pixi.js';

import { ModelSchema } from '../model/schema';
import { type ContainerModel, ContainerComponent, schema as ContainerSchema } from './container';

export interface SpriteModel extends ContainerModel
{
    anchorX: number;
    anchorY: number;
    tint: number;
}

export const schema = new ModelSchema<SpriteModel>({
    ...ContainerSchema.defaults,
    anchorX: 0,
    anchorY: 0,
    tint: 0xffffff,
}, {
    ...ContainerSchema.constraints,
});

export class SpriteComponent<M extends SpriteModel, V extends Sprite> extends ContainerComponent<M, V>
{
    public modelSchema(): ModelSchema<M>
    {
        return schema as unknown as ModelSchema<M>;
    }

    public createView(): V
    {
        return new Sprite(Texture.WHITE) as V;
    }

    public updateView(): void
    {
        const view = this.view;
        const { anchorX, anchorY, tint } = this.model.values;

        super.updateView();

        view.anchor.x = anchorX;
        view.anchor.y = anchorY;
        view.tint = tint;
    }
}
