import '../../core/lib/nodes/register';

import { EventEmitter } from 'eventemitter3';
import { deepEqual } from 'fast-equals';
import { Application as PixiApplication } from 'pixi.js';

import type { ModelValue } from '../../core/lib/model/model';
import type { ClonableNode } from '../../core/lib/nodes/abstract/clonableNode';
import type { ProjectNode } from '../../core/lib/nodes/concrete/project';
import type { CustomPropertyType, CustomPropertyValueType } from '../../core/lib/nodes/customProperties';
import type { Command } from './commands';
import { type DatastoreEvents, Datastore } from './sync/datastore';
import { ObjectGraph } from './sync/objectGraph';
import UndoStack from './undoStack';

export interface AppOptions
{
    canvas: HTMLCanvasElement;
}

export abstract class Application extends EventEmitter
{
    public pixiApp: PixiApplication;
    public datastore: Datastore;
    public undoStack: UndoStack;
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

        this.undoStack = new UndoStack();

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
        this.bindDataStoreEvent('datastoreNodeCloned', objectGraph.onDatastoreNodeCloned);
        this.bindDataStoreEvent('datastoreModelModified', objectGraph.onDatastoreModelModified);

        // get notified when datastore changes
        this.bindDataStoreEvent('datastoreCustomPropDefined', this.onDatastoreCustomPropDefined.bind(this));
        this.bindDataStoreEvent('datastoreCustomPropUndefined', this.onDatastoreCustomPropUndefined.bind(this));
        this.bindDataStoreEvent('datastoreCustomPropAssigned', this.onDatastoreCustomPropAssigned.bind(this));
        this.bindDataStoreEvent('datastoreCustomPropUnAssigned', this.onDatastoreCustomPropUnAssigned.bind(this));
        this.bindDataStoreEvent('datastoreNodeCloned', this.onDatastoreNodeCloned.bind(this));
        this.bindDataStoreEvent('datastoreModelModified', this.onDatastoreModelModified.bind(this));
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
                // console.warn(
                //     `%c${userName}:Event filtered: "${eventName}" data: ${JSON.stringify(eventArgs)}`,
                //     'color:orange',
                // );

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
        return this.undoStack.pushCommand<T>(command);
    }

    public pushCommands(commands: Command[])
    {
        this.undoStack.pushCommands(commands);
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

    protected onDatastoreCustomPropDefined(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        id: string,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        name: string,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        type: CustomPropertyType,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        value: CustomPropertyValueType,
    )
    {
        // subclasses
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected onDatastoreCustomPropUndefined(nodeId: string, propName: string)
    {
        // subclasses
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected onDatastoreCustomPropAssigned(nodeId: string, modelKey: string, customKey: string)
    {
        // subclasses
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected onDatastoreCustomPropUnAssigned(nodeId: string, modelKey: string)
    {
        // subclasses
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected onDatastoreNodeCloned(clonedNode: ClonableNode)
    {
        // subclasses
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected onDatastoreModelModified(nodeId: string, key: string, value: ModelValue)
    {
        // subclasses
    }
}
