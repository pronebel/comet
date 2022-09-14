import type { ConvergenceDomain } from '@convergence/convergence';
import Convergence from '@convergence/convergence';

export class Datastore
{
    public _domain?: ConvergenceDomain;

    public async connect()
    {
        return new Promise<ConvergenceDomain>((resolve, reject) =>
        {
            const url = 'https://localhost/realtime/convergence/default';

            Convergence.connect(url, 'achamas', 'password').then((domain) =>
            {
                this._domain = domain;
                resolve(domain);
            }).catch((e) =>
            {
                reject(e);
            });
        });
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
}
