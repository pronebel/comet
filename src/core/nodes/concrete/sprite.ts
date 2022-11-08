import { Sprite, Texture } from 'pixi.js';

import { type TextureAssetProperties, TextureAsset } from '../../assets/textureAsset';
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
            if (TextureAsset.hasTexture(textureAssetId))
            {
                // texture is loaded
                const asset = TextureAsset.getTexture(textureAssetId);

                if (asset.isResourceReady)
                {
                    this.setTexture(asset.resources as HTMLImageElement, asset.properties);
                }
                else
                {
                    asset.getResource().then((imageElement) =>
                    {
                        this.setTexture(imageElement, asset.properties);
                    });
                }
            }
            else
            {
                // texture needs loading
                debugger;
            }
        }
    }

    protected setTexture(imageElement: HTMLImageElement, properties: TextureAssetProperties)
    {
        const { width, height, mipmap, multisample, resolution, scaleMode, wrapMode } = properties;

        const texture = Texture.from(imageElement, {
            height,
            width,
            mipmap,
            multisample,
            resolution,
            scaleMode,
            wrapMode,
        });

        this.view.texture = texture;
    }

    public get naturalWidth(): number
    {
        const { view, values: { textureAssetId } } = this;

        return textureAssetId ? TextureAsset.getTexture(textureAssetId).properties.width : view.texture.width;
    }

    public get naturalHeight(): number
    {
        const { view, values: { textureAssetId } } = this;

        return textureAssetId ? TextureAsset.getTexture(textureAssetId).properties.height : view.texture.height;
    }
}

