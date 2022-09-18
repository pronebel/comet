import '../../core/lib/nodes/register';

import { EventEmitter } from 'eventemitter3';
import { deepEqual } from 'fast-equals';
import { Application as PixiApplication } from 'pixi.js';

import type { ClonableNode } from '../../core/lib/nodes/abstract/clonableNode';
import type { ProjectNode } from '../../core/lib/nodes/concrete/project';
import type { Command } from './commands';
import { type DatastoreEvents, Datastore } from './sync/datastore';
import { ObjectGraph } from './sync/objectGraph';
import { getUserName } from './sync/user';

const userName = getUserName();

export interface AppOptions
{
    canvas: HTMLCanvasElement;
}

export class Application extends EventEmitter
{
    public pixiApp: PixiApplication;
    public datastore: Datastore;
    public undoStack: (Command[] | Command)[];
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

        // create datastore
        this.datastore = new Datastore();

        // create object graph
        const objectGraph = this.objectGraph = new ObjectGraph();

        // get notified when object graph has changed
        objectGraph.on('objectGraphNodeCreated', this.onObjectGraphNodeCreated.bind(this));
        objectGraph.on('objectGraphNodeRemoved', this.onObjectGraphNodeRemoved.bind(this));
        objectGraph.on('objectGraphParentSet', this.onObjectGraphParentSet.bind(this));

        // update object graph when datastore changes
        this.bindDataStoreEvent('datastoreNodeCreated', objectGraph.onDatastoreNodeCreated);
        this.bindDataStoreEvent('datastoreNodeSetParent', objectGraph.onDatastoreNodeSetParent);
        this.bindDataStoreEvent('datastoreCustomPropDefined', objectGraph.onDataStoreCustomPropDefined);
        this.bindDataStoreEvent('datastoreNodeRemoved', objectGraph.onDatastoreNodeRemoved);
        this.bindDataStoreEvent('datastoreCustomPropUndefined', objectGraph.onDatastoreCustomPropUndefined);
        this.bindDataStoreEvent('datastoreCustomPropAssigned', objectGraph.onDatastoreCustomPropAssigned);
        this.bindDataStoreEvent('datastoreCustomPropUnAssigned', objectGraph.onDatastoreCustomPropUnAssigned);
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

    protected bindDataStoreEvent(eventName: DatastoreEvents, fn: (...args: any[]) => void)
    {
        this.datastore.on(eventName, (...eventArgs: any[]) =>
        {
            const existingEventArgs = this.eventFilter.get(eventName);

            if (existingEventArgs && (deepEqual(eventArgs, existingEventArgs)))
            {
                console.log(
                    `%c${userName}:Event filtered: "${eventName}" data: ${JSON.stringify(eventArgs)}`,
                    'color:orange',
                );

                // return;
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

        console.log(`%c${userName}:Command<${command.name()}>: ${command.toString()}`, 'color:yellow');

        return command.apply() as T;
    }

    public pushCommands(commands: Command[])
    {
        this.undoStack.push(commands);

        commands.forEach((command) =>
        {
            console.log(`%c${userName}:Command<${command.name()}>: ${command.toString()}`, 'color:yellow');
            command.apply();
        });
    }

    public async createProject(name: string, id: string)
    {
        const { datastore, objectGraph } = this;

        if (await datastore.hasProject(name))
        {
            await datastore.deleteProject(id);
        }

        await datastore.createProject(name, id);

        datastore.hydrate(objectGraph);
    }

    public async openProject(id: string)
    {
        const { datastore, objectGraph } = this;

        await datastore.openProject(id);

        datastore.hydrate(objectGraph);
    }

    protected onObjectGraphNodeCreated(node: ClonableNode)
    {
        if (node.nodeType() === 'Project')
        {
            const project = this.project = node as unknown as ProjectNode;

            this.stage.addChild(project.view);
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected onObjectGraphNodeRemoved(nodeId: string, parentId: string)
    {
        // subclasses
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected onObjectGraphParentSet(childNode: ClonableNode, parentNode: ClonableNode)
    {
        // subclasses
    }
}
