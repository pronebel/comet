import type { ConvergenceDomain, RealTimeModel } from '@convergence/convergence';
import Convergence from '@convergence/convergence';

import { createProject } from './schema';
import { getUserName } from './user';

export class DataStore
{
    protected _domain?: ConvergenceDomain;
    protected model?: RealTimeModel;

    public async connect()
    {
        const url = 'https://localhost/realtime/convergence/default';

        const domain = await Convergence.connect(url, getUserName(), 'password');

        console.log(`%cConnected as ${getUserName()}!`, 'color:lime');

        this._domain = domain;
    }

    public get domain()
    {
        if (!this._domain)
        {
            throw new Error('Domain not found');
        }

        return this._domain;
    }

    public disconnect(): void
    {
        if (!this.domain.isDisposed())
        {
            this.domain.dispose();
            console.log('Domain disposed');
        }
    }

    protected get defaultProjectSettings()
    {
        return {
            collection: 'projects',
            overrideCollectionWorldPermissions: false,
            ephemeral: false,
            worldPermissions: { read: true, write: true, remove: true, manage: true },
        };
    }

    public async createProject(name: string, id?: string)
    {
        const data = createProject(name);

        const model = await this.domain.models().openAutoCreate({
            ...this.defaultProjectSettings,
            id,
            data,
        });

        console.log(`Created project "${model.modelId()}"`);

        await this.joinActivity('editProject', model.modelId());

        return model;
    }

    public async openProject(id: string)
    {
        const model = await this.domain.models().openAutoCreate({
            ...this.defaultProjectSettings,
            id,
        });

        console.log(`Opened project "${model.modelId()}"`);

        await this.joinActivity('editProject', id);

        return model;
    }

    protected async joinActivity(type: string, id: string)
    {
        await this.domain.activities().join(type, id, {
            autoCreate: {
                ephemeral: true,
                worldPermissions: ['join', 'view_state', 'set_state'],
            },
        });

        console.log(`Joined activity "${type}:${id}"`);
    }

    public async hasProject(name: string)
    {
        const results = await this.domain.models()
            .query(`SELECT * FROM projects WHERE name = '${name}'`);

        if (results.totalResults > 0)
        {
            return true;
        }

        return false;
    }

    public async deleteProject(id: string)
    {
        await this.domain.models().remove(id);

        console.log(`Project "${id}" deleted`);
    }
}
