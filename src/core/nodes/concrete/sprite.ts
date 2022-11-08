import Color from 'color';
import { Sprite, Texture } from 'pixi.js';

import type { TextureAssetProperties } from '../../assets/textureAsset';
import { Cache } from '../../cache';
import { ModelSchema } from '../../model/schema';
import { delay } from '../../util';
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
            if (Cache.textures.has(textureAssetId))
            {
                // texture is loaded
                const asset = Cache.textures.get(textureAssetId);

                if (asset.isResourceReady)
                {
                    this.setTexture(asset.resource as HTMLImageElement, asset.properties);
                }
                else
                {
                    const rnd = Math.round(Math.random() * 100) + 0;

                    view.texture = Texture.WHITE;
                    view.tint = Color.rgb(rnd, rnd, rnd).rgbNumber();
                    view.scale.x = asset.properties.width / 16;
                    view.scale.y = asset.properties.height / 16;

                    asset.getResource().then((imageElement) =>
                    {
                        delay(0).then(() =>
                        {
                            this.setTexture(imageElement, asset.properties);
                        });
                    });
                }
            }
            else
            {
                throw new Error(`Texture "${textureAssetId}" was not loaded correctly in cache`);
            }
        }
    }

    protected setTexture(imageElement: HTMLImageElement, properties: TextureAssetProperties)
    {
        const { width, height, mipmap, multisample, resolution, scaleMode, wrapMode } = properties;
        const { view, model: { values: { scaleX, scaleY, tint } } } = this;

        const texture = Texture.from(imageElement, {
            height,
            width,
            mipmap,
            multisample,
            resolution,
            scaleMode,
            wrapMode,
        });

        view.texture = texture;
        view.scale.x = scaleX;
        view.scale.y = scaleY;
        view.tint = tint;
    }

    public get naturalWidth(): number
    {
        const { view, values: { textureAssetId } } = this;

        return textureAssetId ? Cache.textures.get(textureAssetId).properties.width : view.texture.width;
    }

    public get naturalHeight(): number
    {
        const { view, values: { textureAssetId } } = this;

        return textureAssetId ? Cache.textures.get(textureAssetId).properties.height : view.texture.height;
    }
}

