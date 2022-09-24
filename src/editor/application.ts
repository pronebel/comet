import '../core/nodes/register';

import { EventEmitter } from 'eventemitter3';
import { Application as PixiApplication } from 'pixi.js';

import type { ProjectNode } from '../core/nodes/concrete/project';
import { clearGraphNodeRegistrations } from '../core/nodes/factory';
import type { AbstractCommand } from './abstractCommand';
import type { CloneCommandReturn } from './commands/clone';
import { SetParentCommand } from './commands/setParent';
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
        }

        const result = command.exec();

        this.emit('commandExec', command, result);
        this.onCommand(command, result);

        return result as unknown as R;
    }

    protected onCommand(command: AbstractCommand, result: unknown)
    {
        console.log('🔔', { name: command.name, command, result });

        const commandName = command.name;

        if (commandName === 'Clone')
        {
            const { sourceNode, clonedNode } = result as CloneCommandReturn;

            const parentNode = sourceNode.parent;

            if (parentNode)
            {
                this.exec(new SetParentCommand({ parentId: parentNode.id, childId: clonedNode.id }));
            }
        }
    }

    public writeUndoStack(endIndex = 0)
    {
        const data = JSON.stringify(this.undoStack.toJSON(endIndex), null, 4);

        localStorage['undoStack'] = data;
        console.log(`UndoStack${endIndex === 0 ? '' : endIndex}.write:`, data);
    }

    public readUndoStack()
    {
        const data = localStorage['undoStack'];

        if (data)
        {
            console.log(`UndoStack.read:`, data);
            const json = JSON.parse(data);

            this.undoStack.fromJSON(json);
        }
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
