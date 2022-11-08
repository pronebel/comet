import type { TextureAsset } from '../assets/textureAsset';
import { CacheBase } from './cacheBase';

export class TextureCache extends CacheBase<TextureAsset>
{
    protected get type()
    {
        return 'Texture';
    }
}
