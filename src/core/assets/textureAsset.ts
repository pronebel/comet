import { MIPMAP_MODES, MSAA_QUALITY, SCALE_MODES, WRAP_MODES } from 'pixi.js';

import { Asset } from './asset';
import { blobToBas64 } from './util';

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

export class TextureAsset extends Asset<TextureAssetProperties>
{
    protected base64?: string;

    public async getDataURI()
    {
        if (this.base64)
        {
            return this.base64;
        }

        this.base64 = await blobToBas64(this.blob);

        return this.base64;
    }

    get defaultProperties(): TextureAssetProperties
    {
        return {
            width: 0,
            height: 0,
            mipmap: MIPMAP_MODES.OFF,
            multisample: MSAA_QUALITY.NONE,
            resolution: 1,
            scaleMode: SCALE_MODES.NEAREST,
            wrapMode: WRAP_MODES.CLAMP,
        };
    }
}
