import '../../core/lib/nodes/register';

import { EventEmitter } from 'eventemitter3';
import { deepEqual } from 'fast-equals';
import { Application as PixiApplication } from 'pixi.js';

import type { ClonableNode } from '../../core/lib/nodes/abstract/clonableNode';
import type { ProjectNode } from '../../core/lib/nodes/concrete/project';
import type { Command } from './commands';
import { type DatastoreEvents, Datastore } from './sync/datastore';
import { ObjectGraph } from './sync/objectGraph';

export interface AppOptions
{
    canvas: HTMLCanvasElement;
}

export class Application extends EventEmitter
{
    public pixiApp: PixiApplication;
    public datastore: Datastore;
    public undoStack: Command[];
    public objectGraph: ObjectGraph;
    public project?: ProjectNode;

    protected eventFilter: Map<string, any[]>;

    private static _instance: Application;

    constructor(public readonly options: AppOptions)
    {
        super();

        Application._instance = this;

        this.eventFilter = new Map();

        this.pixiApp = new PixiApplication({
            view: options.canvas,
            resizeTo: options.canvas,
            backgroundColor: 0x333333,
        });

        this.undoStack = [];

        // create object graph
        const objectGraph = this.objectGraph = new ObjectGraph();

        objectGraph.on('nodeCreated', this.onObjectGraphNodeCreated.bind(this));

        // create datastore
        this.datastore = new Datastore();

        this.bindDataStoreEvent('nodeCreated', objectGraph.createNode);
        this.bindDataStoreEvent('nodeChildAdded', objectGraph.childAdded);
    }

    protected bindDataStoreEvent(eventName: DatastoreEvents, fn: (...args: any[]) => void)
    {
        this.datastore.on(eventName, (...eventArgs: any[]) =>
        {
            const existingEventArgs = this.eventFilter.get(eventName);

            if (existingEventArgs && (deepEqual(eventArgs, existingEventArgs)))
            {
                return;
            }

            this.eventFilter.set(eventName, eventArgs);

            fn(...eventArgs);
        });
    }

    public async connect()
    {
        return this.datastore.connect();
    }

    public async init()
    {
        // subclasses
    }

    public pushCommand<T = void>(command: Command): T
    {
        this.undoStack.push(command);

        return command.apply() as T;
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

    public async createProject(name: string, id: string)
    {
        const { datastore, objectGraph } = this;

        if (await datastore.hasProject(name))
        {
            await datastore.deleteProject(id);
        }

        await datastore.createProject(name, id);

        objectGraph.hydrate(datastore);
    }

    public async openProject(id: string)
    {
        const { datastore, objectGraph } = this;

        await this.datastore.openProject(id);

        objectGraph.hydrate(datastore);
    }

    protected onObjectGraphNodeCreated(node: ClonableNode)
    {
        if (node.nodeType() === 'Project')
        {
            const project = this.project = node as unknown as ProjectNode;

            this.stage.addChild(project.view);

            console.log('add Project view to stage');
        }
    }
}
