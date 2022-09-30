// note: this file must be imported to trigger node type registration
import '../core/nodes/concrete';

import { EventEmitter } from 'eventemitter3';
import { Application as PixiApplication } from 'pixi.js';

import type { ProjectNode } from '../core/nodes/concrete/project';
import { clearInstances } from '../core/nodes/instances';
import type { AbstractCommand } from './abstractCommand';
import { createCommand } from './commandFactory';
import { Datastore } from './sync/datastore';
import { NodeUpdater } from './sync/nodeUpdater';
import { getUserName } from './sync/user';
import UndoStack from './undoStack';

const userName = getUserName();
const localStorageCommandsKey = `${userName}:commands`;

export interface AppOptions
{
    canvas: HTMLCanvasElement;
}

export type AppEvents = 'commandExec';

export abstract class Application extends EventEmitter<AppEvents>
{
    public pixiApp: PixiApplication;
    public datastore: Datastore;
    public nodeUpdater: NodeUpdater;
    public undoStack: UndoStack;
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

        this.datastore = new Datastore();
        this.undoStack = new UndoStack(this.datastore);
        this.nodeUpdater = new NodeUpdater(this.datastore);
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

    public undo = () =>
    {
        this.undoStack.undo();
        this.onUndo();
    };

    public redo = () =>
    {
        this.undoStack.redo();
        this.onRedo();
    };

    protected onUndo()
    {
        //
    }

    protected onRedo()
    {
        //
    }

    public connect()
    {
        return this.datastore.connect();
    }

    public async init()
    {
        // subclasses
    }

    public exec<R = unknown>(command: AbstractCommand, isUndoRoot = true): R
    {
        console.log(`%c🔔 ${userName}:${command.name}: %c${JSON.stringify(command.params)}`, 'color:cyan', 'color:yellow');

        command.isUndoRoot = isUndoRoot;
        this.undoStack.push(command);
        this.writeUndoStack();

        const result = command.run();

        this.emit('commandExec', command, result);

        return result as unknown as R;
    }

    public writeUndoStack()
    {
        const data = JSON.stringify(this.undoStack.toJSON(), null, 4);

        localStorage[localStorageCommandsKey] = data;
    }

    public readUndoStack(endIndex: number | undefined = undefined)
    {
        const data = localStorage[localStorageCommandsKey];

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
            clearInstances();

            this.undoStack.clear();
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
