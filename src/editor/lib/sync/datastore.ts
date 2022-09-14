import type { ConvergenceDomain, RealTimeModel } from '@convergence/convergence';
import Convergence from '@convergence/convergence';

import { defaultProject } from './schema';

export class DataStore
{
    protected _domain?: ConvergenceDomain;
    protected _model?: RealTimeModel;

    public async connect()
    {
        return new Promise<ConvergenceDomain>((resolve, reject) =>
        {
            const url = 'https://localhost/realtime/convergence/default';

            const user = this.getUser();

            Convergence.connect(url, user, 'password').then((domain) =>
            {
                this._domain = domain;
                resolve(domain);
            }).catch((e) =>
            {
                reject(e);
            });
        });
    }

    public getUser()
    {
        const url = new URL(window.location.href);
        const params = new URLSearchParams(url.search);
        const user = params.get('user');

        if (!user)
        {
            throw new Error('Missing "?user=" query parameter');
        }

        return user;
    }

    public get domain()
    {
        if (!this._domain)
        {
            throw new Error('Domain not found');
        }

        return this._domain;
    }

    public get model()
    {
        if (!this._model)
        {
            throw new Error('Model not found');
        }

        return this._model;
    }

    public disconnect(): void
    {
        if (!this.domain.isDisposed())
        {
            this.domain.dispose();
            console.log('Domain disposed');
        }
    }

    public openProject(id: string)
    {
        return new Promise<RealTimeModel>((resolve, reject) =>
        {
            const { domain } = this;
            const data = defaultProject();

            domain.models().openAutoCreate({
                collection: 'projects',
                id,
                data,
                overrideCollectionWorldPermissions: false,
                worldPermissions: { read: true, write: true, remove: true, manage: true },
                // userPermissions: {
                //     ted: { read: true, write: false, remove: false, manage: false },
                // },
                ephemeral: false,
            }).then((model) =>
            {
                this._model = model;

                domain.activities().join('project', id, {
                    autoCreate: {
                        ephemeral: true,
                        worldPermissions: ['join', 'view_state', 'set_state'],
                    },
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                }).then((activity) =>
                {
                    resolve(model);
                });
            }).catch((e) =>
            {
                reject(e);
            });
        });
    }
}
