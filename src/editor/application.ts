import '../core/nodes/nodeRegister';

import { EventEmitter } from 'eventemitter3';
import { Application as PixiApplication } from 'pixi.js';

import type { ProjectNode } from '../core/nodes/concrete/project';
import { clearGraphNodeRegistrations } from '../core/nodes/nodeFactory';
import type { AbstractCommand } from './abstractCommand';
import { createCommand } from './commandFactory';
import { Datastore } from './sync/datastore';
import UndoStack from './undoStack';

export interface AppOptions
{
    canvas: HTMLCanvasElement;
}

export type AppEvents = 'commandExec';

export abstract class Application extends EventEmitter<AppEvents>
{
    public pixiApp: PixiApplication;
    public datastore: Datastore;
    public undoStack: UndoStack;
    // public objectGraph: ObjectGraph;
    public project?: ProjectNode;

    private static _instance: Application;

    constructor(public readonly options: AppOptions)
    {
        super();

        Application._instance = this;

        (window as any).app = this;

        this.pixiApp = new PixiApplication({
            view: options.canvas,
            resizeTo: options.canvas,
            backgroundColor: 0x333333,
        });

        this.undoStack = new UndoStack();

        // create datastore
        this.datastore = new Datastore();
    }

    public static get instance()
    {
        if (!Application._instance)
        {
            throw new Error('Application not defined');
        }

        return Application._instance;
    }

    public get stage()
    {
        return this.pixiApp.stage;
    }

    public connect()
    {
        return this.datastore.connect();
    }

    public async init()
    {
        // subclasses
    }

    public exec<R = unknown>(command: AbstractCommand): R
    {
        const shouldTrack = !command.isStandAlone;

        if (shouldTrack)
        {
            this.undoStack.push(command);
            this.writeUndoStack();
        }

        const result = command.exec();

        this.onCommand(command, result);

        this.emit('commandExec', command, result);

        return result as unknown as R;
    }

    protected onCommand(command: AbstractCommand, result: unknown)
    {
        console.log('🔔', { name: command.name, command, result });
    }

    public writeUndoStack()
    {
        const data = JSON.stringify(this.undoStack.toJSON(), null, 4);

        localStorage['undoStack'] = data;
    }

    public readUndoStack(endIndex: number | undefined = undefined)
    {
        const data = localStorage['undoStack'];

        if (data)
        {
            let json = JSON.parse(data) as any[];

            json = json.slice(0, endIndex);

            return json.map((params) =>
                createCommand(params.$, params));
        }

        return [];
    }

    protected resetState()
    {
        if (this.project)
        {
            this.undoStack.clear();
            clearGraphNodeRegistrations();
            this.datastore.reset();
            this.stage.removeChild(this.project.view);
            delete this.project;
        }
    }

    public async createProject(name: string, id: string)
    {
        const { datastore } = this;

        this.resetState();

        if (await datastore.hasProject(name))
        {
            await datastore.deleteProject(id);
        }

        const project = await datastore.createProject(name, id) as unknown as ProjectNode;

        this.initProject(project);
    }

    public async openProject(id: string)
    {
        this.resetState();

        const project = await this.datastore.openProject(id) as unknown as ProjectNode;

        this.initProject(project);
    }

    protected initProject(project: ProjectNode)
    {
        this.project = project;
    }

    protected onDatastoreHydrated()
    {
        if (this.project)
        {
            this.project.updateRecursive();
        }
    }
}
