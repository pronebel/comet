import { MIPMAP_MODES, MSAA_QUALITY, SCALE_MODES, WRAP_MODES } from 'pixi.js';

import { Cache } from '../cache';
import { blobToBas64, loadImage } from '../util/file';
import { Asset } from './asset';

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
    public async getResource()
    {
        if (this.resource)
        {
            return this.resource;
        }

        if (!this.blob)
        {
            this.blob = await Cache.textures.fetch(this.storageKey);
        }

        const dataURI = await blobToBas64(this.blob);

        this.resource = await loadImage(dataURI);

        return this.resource;
    }
}
