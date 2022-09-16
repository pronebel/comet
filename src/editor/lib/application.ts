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

        const objectGraph = this.objectGraph = new ObjectGraph();

        objectGraph.on('nodeCreated', this.onObjectGraphNodeCreated);

        this.datastore = new Datastore();

        this.bindDataStoreEvent('nodeCreated', objectGraph.createNode);
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

    public pushCommand(command: Command)
    {
        this.undoStack.push(command);
        command.apply();
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

    protected onObjectGraphNodeCreated = (node: ClonableNode) =>
    {
        if (node.nodeType() === 'Project')
        {
            const project = this.project = node as ProjectNode;

            this.stage.addChild(project.view);
        }
    };
}
