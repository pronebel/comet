import { MIPMAP_MODES, MSAA_QUALITY, SCALE_MODES, WRAP_MODES } from 'pixi.js';

import { type AssetCacheKey, Asset } from './asset';
import { blobToBas64, loadImage } from './util';

export interface TextureAssetProperties
{
    width: number;
    height: number;
    mipmap: MIPMAP_MODES;
    multisample: MSAA_QUALITY;
    resolution: number;
    scaleMode: SCALE_MODES;
    wrapMode: WRAP_MODES;
}

export const defaultTextureAssetProperties: TextureAssetProperties = {
    width: 0,
    height: 0,
    mipmap: MIPMAP_MODES.OFF,
    multisample: MSAA_QUALITY.NONE,
    resolution: 1,
    scaleMode: SCALE_MODES.NEAREST,
    wrapMode: WRAP_MODES.CLAMP,
};

export class TextureAsset extends Asset<TextureAssetProperties, HTMLImageElement>
{
    public static getTexture(id: string)
    {
        return Asset.getAsset<TextureAsset>('textures', id);
    }

    public static hasTexture(id: string)
    {
        return Asset.hasAsset('textures', id);
    }

    public async getResource()
    {
        if (this.resources)
        {
            return this.resources;
        }

        const dataURI = await blobToBas64(this.blob);

        this.resources = await loadImage(dataURI);

        return this.resources;
    }

    get cacheKey()
    {
        return 'textures' as AssetCacheKey;
    }
}
