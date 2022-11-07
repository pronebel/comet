import { base64ToBlob, blobToBas64 } from '../../core/assets/util';
import { StorageProvider } from './storageProvider';

const storageKeyPrefix = 'comet.asset:';

export class LocalStorageProvider extends StorageProvider {
    protected get idKey() {
        return this.key('id');
    }

    protected key(key: string) {
        return `${storageKeyPrefix}:${key}`;
    }

    protected newId() {
        const { idKey } = this;
        const idStr = localStorage.getItem(idKey);

        if (idStr) {
            const idNum = parseFloat(idStr) + 1;
            const id = `${idNum}`;
            localStorage.setItem(idKey, id);
            return id;
        }

        throw new Error('Could not create new localStorage id');

    }
    
    public init(): Promise<void>
    {
        const key = this.key('id');

        if (!localStorage.getItem(key)) {
            localStorage.setItem(key, '0')
        }

        return Promise.resolve();
    }

    public async upload(blob: Blob)
    {
        const base64 = await blobToBas64(blob);
        const id = this.newId();
        localStorage.setItem(this.key(id), base64);
        return id;
    }

    public async download(id: string)
    {
        const key = this.key(id);
        const base64 = localStorage.getItem(key);

       if (base64) {
        return base64ToBlob(base64);
       }

       throw new Error(`Could not retrieve localStorage data for id "${id}"`);
    }

    public delete(id: string): Promise<void>
    {
        throw new Error('Method not implemented.');
    }

}