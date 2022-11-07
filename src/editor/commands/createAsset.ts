import { Asset } from '../../core/assets/asset';
import { registerInstance } from '../../core/nodes/instances';
import { Command } from '../core/command';

export interface CreateAssetCommandParams
{
    file: File;
}

export interface CreateAssetCommandReturn
{
    promise: Promise<Asset>;
}

export class CreateAssetCommand extends Command<CreateAssetCommandParams, CreateAssetCommandReturn>
{
    public static commandName = 'CreateAsset';

    protected async upload(file: File)
    {
        const { app, datastore } = this;

        const storageKey = await app.storageProvider.upload(file);

        const asset = new Asset(storageKey, file.name, file.type, file.size, file);

        registerInstance(asset);

        await datastore.createAsset(asset);

        await Asset.store(asset);

        return asset;
    }

    public apply(): CreateAssetCommandReturn
    {
        const { params: { file } } = this;

        const promise = this.upload(file);

        return { promise };
    }

    public undo(): void
    {
        throw new Error('Unimplemented');
    }
}
