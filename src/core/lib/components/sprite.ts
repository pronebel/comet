import type { Container } from 'pixi.js';
import { Sprite, Texture } from 'pixi.js';

import { type ModelSchema, createModelSchema } from '../model/schema';
import { type ContainerModel, ContainerComponent, schema as ContainerSchema } from './container';

export interface SpriteModel extends ContainerModel
{
    tint: number;
}

export const schema = createModelSchema<SpriteModel>({
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

    protected onAddedToParent(): void
    {
        if (this.parent)
        {
            const thisView = this.view;
            const parentView = this.parent.getView<Container>();

            parentView.addChild(thisView);
        }
    }
}
