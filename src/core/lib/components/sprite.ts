import { Sprite, Texture } from 'pixi.js';

import { ModelSchema } from '../model/schema';
import { type ContainerModel, ContainerComponent, schema as ContainerSchema } from './container';

export interface SpriteModel extends ContainerModel
{
    tint: number;
}

export const schema = new ModelSchema<SpriteModel>({
    ...ContainerSchema.defaults,
    tint: 0xffffff,
}, {
    ...ContainerSchema.constraints,
});

export class SpriteComponent extends ContainerComponent<SpriteModel, Sprite>
{
    public modelSchema(): ModelSchema<SpriteModel>
    {
        return schema;
    }

    public createView(): Sprite
    {
        return new Sprite(Texture.WHITE);
    }

    public updateView(): void
    {
        const { tint } = this.model.values;

        super.updateView();

        this.view.tint = tint;
    }
}
