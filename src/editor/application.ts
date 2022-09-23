import '../core/nodes/register';

import { EventEmitter } from 'eventemitter3';
import { Application as PixiApplication } from 'pixi.js';

import type { ModelBase } from '../core/model/model';
import type { ClonableNode } from '../core/nodes/abstract/clonableNode';
import type { ProjectNode } from '../core/nodes/concrete/project';
import type { CustomPropertyType, CustomPropertyValueType } from '../core/nodes/customProperties';
import type { Commands } from './commandFactory';
import { type CommandParams, createCommand } from './commandFactory';
import { Datastore } from './sync/datastore';
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

        (window as any).app = this;

        // todo: this shouldn't be needed
        this.eventFilter = new Map();

        this.pixiApp = new PixiApplication({
            view: options.canvas,
            resizeTo: options.canvas,
            backgroundColor: 0x333333,
        });

        this.undoStack = new UndoStack();

        // create datastore
        const datastore = this.datastore = new Datastore();

        // create object graph
        const objectGraph = this.objectGraph = new ObjectGraph();

        // get notified when object graph has changed
        objectGraph.on('objectGraphNodeCreated', this.onObjectGraphNodeCreated.bind(this));
        objectGraph.on('objectGraphNodeRemoved', this.onObjectGraphNodeRemoved.bind(this));
        objectGraph.on('objectGraphParentSet', this.onObjectGraphParentSet.bind(this));

        // update object graph when datastore changes
        datastore.on('datastoreNodeCreated', objectGraph.onDatastoreNodeCreated);
        datastore.on('datastoreNodeRemoved', objectGraph.onDatastoreNodeRemoved);
        datastore.on('datastoreNodeSetParent', objectGraph.onDatastoreNodeSetParent);
        datastore.on('datastoreCustomPropDefined', objectGraph.onDataStoreCustomPropDefined);
        datastore.on('datastoreCustomPropUndefined', objectGraph.onDatastoreCustomPropUndefined);
        datastore.on('datastoreCustomPropAssigned', objectGraph.onDatastoreCustomPropAssigned);
        datastore.on('datastoreCustomPropUnAssigned', objectGraph.onDatastoreCustomPropUnAssigned);
        datastore.on('datastoreNodeCloned', objectGraph.onDatastoreNodeCloned);
        datastore.on('datastoreModelModified', objectGraph.onDatastoreModelModified);
        datastore.on('datastoreCloneInfoModified', objectGraph.onDatastoreCloneInfoModified);
        datastore.on('datastoreNodeUnlinked', objectGraph.onDatastoreNodeUnlinked);

        // get notified when datastore changes
        datastore.on('datastoreHydrated', this.onDatastoreHydrated.bind(this));
        datastore.on('datastoreCustomPropDefined', this.onDatastoreCustomPropDefined.bind(this));
        datastore.on('datastoreCustomPropUndefined', this.onDatastoreCustomPropUndefined.bind(this));
        datastore.on('datastoreCustomPropAssigned', this.onDatastoreCustomPropAssigned.bind(this));
        datastore.on('datastoreCustomPropUnAssigned', this.onDatastoreCustomPropUnAssigned.bind(this));
        datastore.on('datastoreNodeCloned', this.onDatastoreNodeCloned.bind(this));
        datastore.on('datastoreModelModified', this.onDatastoreModelModified.bind(this));
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

    public exec<T, K extends keyof typeof Commands, P extends CommandParams[K]>(commandName: K, params: P)
    {
        const command = createCommand(commandName, params);

        return this.undoStack.push<T>(command);
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

    protected onDatastoreHydrated()
    {
        if (this.project)
        {
            this.project.updateRecursive();
        }
    }

    protected onObjectGraphNodeCreated(node: ClonableNode)
    {
        if (node.nodeType() === 'Project')
        {
            const project = this.project = node as unknown as ProjectNode;

            this.stage.addChild(project.view);
        }
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected onObjectGraphNodeRemoved(nodeId: string, parentId: string)
    {
        // subclasses
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected onObjectGraphParentSet(childNode: ClonableNode, parentNode: ClonableNode)
    {
        // subclasses
    }

    protected onDatastoreCustomPropDefined(
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        id: string,
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        name: string,
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        type: CustomPropertyType,
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        value: CustomPropertyValueType,
    )
    {
        // subclasses
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected onDatastoreCustomPropUndefined(nodeId: string, propName: string)
    {
        // subclasses
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected onDatastoreCustomPropAssigned(nodeId: string, modelKey: string, customKey: string)
    {
        // subclasses
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected onDatastoreCustomPropUnAssigned(nodeId: string, modelKey: string)
    {
        // subclasses
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected onDatastoreNodeCloned(clonedNode: ClonableNode)
    {
        // subclasses
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected onDatastoreModelModified(nodeId: string, values: ModelBase)
    {
        // subclasses
    }
}
