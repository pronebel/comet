import type {  ConvergenceDomain,  IConvergenceEvent,  ObjectSetEvent,  RealTimeModel } from '@convergence/convergence';
import Convergence, { RealTimeObject  } from '@convergence/convergence';
import { EventEmitter } from 'eventemitter3';

import { createProjectSchema } from './schema';
import { getUserName } from './user';

export type DatastoreEvents = 'nodeCreated' | 'nodeChildAdded';

export class Datastore extends EventEmitter<DatastoreEvents>
{
    protected _domain?: ConvergenceDomain;
    protected _model?: RealTimeModel;

    public async connect()
    {
        const url = 'https://localhost/realtime/convergence/default';

        const domain = await Convergence.connect(url, getUserName(), 'password', {
            models: {
                data: {
                    undefinedObjectValues: 'omit',
                    undefinedArrayValues: 'null',
                },
            },
        });

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

    get model()
    {
        if (!this._model)
        {
            throw new Error('Datastore model not initialised');
        }

        return this._model;
    }

    get nodes()
    {
        return this.model.elementAt('nodes') as RealTimeObject;
    }

    get hierarchy()
    {
        return this.model.elementAt('hierarchy') as RealTimeObject;
    }

    public async createProject(name: string, id?: string)
    {
        const data = createProjectSchema(name);

        const model = await this.domain.models().openAutoCreate({
            ...this.defaultProjectSettings,
            id,
            data,
        });

        console.log(`Created project "${model.modelId()}"`);

        await this.openProject(model.modelId());
    }

    public async openProject(id: string)
    {
        const model = await this.domain.models().open(id);

        console.log(`Opened project "${model.modelId()}"`);

        await this.initModel(model);
    }

    protected async initModel(model: RealTimeModel)
    {
        this._model = model;

        await this.joinActivity('editProject', model.modelId());

        // note: these events only fire for remote users, which is why we use a custom event dispatcher
        // remote users will be triggered from these handlers,
        // local users will be triggered from command actions
        this.nodes.on(RealTimeObject.Events.SET, (event: IConvergenceEvent) =>
        {
            const nodeSchema = (event as ObjectSetEvent).value.value();

            this.emit('nodeCreated', nodeSchema);
        });

        this.hierarchy.on(RealTimeObject.Events.SET, (event: IConvergenceEvent) =>
        {
            const parentId = (event as ObjectSetEvent).key;
            const childId = (event as ObjectSetEvent).value.value();

            console.log('hierarchy!', parentId, childId);

            this.emit('nodeChildAdded', parentId, childId);
        });
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

    public async closeProject()
    {
        if (this._model)
        {
            await this._model.close();
            delete this._model;
        }
    }

    public async deleteProject(id: string)
    {
        await this.domain.models().remove(id);

        console.log(`Delete project "${id}"`);
    }
}
