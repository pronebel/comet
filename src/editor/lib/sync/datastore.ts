import {  type ConvergenceDomain,  type IConvergenceEvent,  type ObjectSetEvent,  type RealTimeModel, RealTimeString  } from '@convergence/convergence';
import Convergence, { RealTimeObject } from '@convergence/convergence';
import { EventEmitter } from 'eventemitter3';

import { createProjectSchema } from './schema';
import { getUserName } from './user';

const userName = getUserName();

export type DatastoreEvents =
| 'datastoreNodeCreated'
| 'datastoreNodeSetParent'
| 'datastoreNodeRemoved'
| 'datastoreCustomPropDefined';

const logStyle = 'color:cyan';

export class Datastore extends EventEmitter<DatastoreEvents>
{
    protected _domain?: ConvergenceDomain;
    protected _model?: RealTimeModel;
    public nodeRealtimeObjects: Map<string, RealTimeObject>;

    constructor()
    {
        super();
        this.nodeRealtimeObjects = new Map();
    }

    public async connect()
    {
        const url = 'https://localhost/realtime/convergence/default';

        const domain = await Convergence.connect(url, userName, 'password', {
            models: {
                data: {
                    undefinedObjectValues: 'omit',
                    undefinedArrayValues: 'null',
                },
            },
        });

        console.log(`%cConnected as ${userName}!`, 'color:lime');

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
            console.log('%c${userName}:Domain disposed', logStyle);
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

    public async createProject(name: string, id?: string)
    {
        const data = createProjectSchema(name);

        const model = await this.domain.models().openAutoCreate({
            ...this.defaultProjectSettings,
            id,
            data,
        });

        console.log(`%c${userName}:Created project "${model.modelId()}"`, logStyle);

        await this.openProject(model.modelId());
    }

    public async openProject(id: string)
    {
        const model = await this.domain.models().open(id);

        console.log(`%c${userName}:Opened project "${model.modelId()}"`, logStyle);

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
            const nodeElement = (event as ObjectSetEvent).value as RealTimeObject;
            const parentId = nodeElement.get('parent').value() as string | undefined;

            console.log(`%c${userName}:nodes.set: ${JSON.stringify(nodeElement.toJSON())}`, logStyle);

            this.emit('datastoreNodeCreated', nodeElement);

            if (parentId)
            {
                const childId = nodeElement.get('id').value() as string;

                this.emit('datastoreNodeSetParent', parentId, childId);
            }
        }).on(RealTimeObject.Events.REMOVE, (event: IConvergenceEvent) =>
        {
            const nodeId = (event as ObjectSetEvent).key;

            const nodeElement = (event as ObjectSetEvent).oldValue as RealTimeObject;
            const parentId = nodeElement.get('parent').value() as string | undefined;

            console.log(`%c${userName}:nodes.remove: ${nodeId}`, logStyle);

            if (parentId)
            {
                this.emit('datastoreNodeRemoved', nodeId, parentId);
            }
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

        console.log(`%c${userName}:Joined activity "${type}:${id}"`, logStyle);
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

        console.log(`%c${userName}:Delete project "${id}"`, logStyle);
    }

    public registerNode(id: string, nodeElement: RealTimeObject)
    {
        if (this.nodeRealtimeObjects.has(id))
        {
            throw new Error(`Node "${id}" RealTimeObject already registered.`);
        }

        this.nodeRealtimeObjects.set(id, nodeElement);

        nodeElement.elementAt('customProperties', 'defined').on(RealTimeObject.Events.SET, (event: IConvergenceEvent) =>
        {
            const name = (event as ObjectSetEvent).key;
            const element = (event as ObjectSetEvent).value as RealTimeObject;
            const { type, value } = element.toJSON();
            const info = JSON.stringify(element.toJSON());

            console.log(`%c${userName}:customProperties.set: ${info}`, logStyle);

            this.emit('datastoreCustomPropDefined', id, name, type, value);
        });

        nodeElement.on(RealTimeObject.Events.SET, (event: IConvergenceEvent) =>
        {
            const key = (event as ObjectSetEvent).key;

            if (key === 'parent')
            {
                const parentId = (event as ObjectSetEvent).value.value();
                const childId = nodeElement.get('id').value();

                console.log(`%c${userName}:parent.set: ${parentId} ${childId}`, logStyle);

                this.emit('datastoreNodeSetParent', parentId, childId);
            }
        });

        console.log(`${userName}:Register RealTimeObject "${id}"`);
    }

    public unRegisterNode(id: string)
    {
        if (!this.nodeRealtimeObjects.has(id))
        {
            throw new Error(`Cannot remove Node "${id}" as RealTimeObject is not registered.`);
        }

        this.nodeRealtimeObjects.delete(id);

        console.log(`${userName}:Unregister RealTimeObject "${id}"`);
    }

    public getNode(id: string)
    {
        const nodeElement = this.nodeRealtimeObjects.get(id);

        if (!nodeElement)
        {
            throw new Error(`Node "${id}" RealTimeObject not registered.`);
        }

        return nodeElement;
    }
}
