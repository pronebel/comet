import { Sprite, Texture } from 'pixi.js';

import { Asset } from '../../assets/asset';
import type { TextureAsset } from '../../assets/textureAsset';
import { ModelSchema } from '../../model/schema';
import { type ContainerModel, ContainerNode, containerSchema } from './container';

export interface SpriteModel extends ContainerModel
{
    anchorX: number;
    anchorY: number;
    tint: number;
    textureAssetId: string | null;
}

export const spriteSchema = new ModelSchema<SpriteModel>({
    ...containerSchema.defaults,
    anchorX: 0,
    anchorY: 0,
    tint: 0xffffff,
    textureAssetId: null,
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
        const { view, values: { anchorX, anchorY, tint, textureAssetId } } = this;

        super.updateView();

        view.anchor.x = anchorX;
        view.anchor.y = anchorY;
        view.tint = tint;

        if (textureAssetId !== null)
        {
            const asset = Asset.get<TextureAsset>(textureAssetId);

            asset.getDataURI().then((dataURI) =>
            {
                const { width, height, mipmap, multisample, resolution, scaleMode, wrapMode } = asset.properties;
                const texture = Texture.from(dataURI, {
                    height,
                    width,
                    mipmap,
                    multisample,
                    resolution,
                    scaleMode,
                    wrapMode,
                });

                this.view.texture = texture;
            });
        }
    }

    public get naturalWidth(): number
    {
        return this.view.texture.width;
    }

    public get naturalHeight(): number
    {
        return this.view.texture.height;
    }
}

