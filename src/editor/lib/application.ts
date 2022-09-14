import { EventEmitter } from 'eventemitter3';
import { Application as PixiApplication } from 'pixi.js';

import { Document } from '../../core/lib/document';
import { ProjectNode } from '../../core/lib/node/types/project';
import type { Command } from './commands';
import { DataStore } from './sync/datastore';
import { Sync } from './sync/sync';

export interface AppOptions
{
    canvas: HTMLCanvasElement;
}
export class Application extends EventEmitter
{
    public pixiApp: PixiApplication;
    public document: Document;
    public dataStore: DataStore;
    public undoStack: Command[];

    private static _instance: Application;

    constructor(public readonly options: AppOptions)
    {
        super();

        Application._instance = this;

        this.pixiApp = new PixiApplication({
            view: options.canvas,
            resizeTo: options.canvas,
            backgroundColor: 0x333333,
        });

        this.undoStack = [];

        this.dataStore = new DataStore();

        const document = this.document = new Document(new Sync());

        document.sync.on('sync', this.onDocSync);

        this.dataStore.connect().then(() =>
        {
            this.onConnect();
        }).catch((e) =>
        {
            this.onConnectError(e);
        });
    }

    protected onConnect()
    {
        console.log(`%cConnected as ${this.dataStore.getUser()}!`, 'color:lime');

        const project = new ProjectNode();

        this.document.project = project;

        this.stage.addChild(project.view);
    }

    protected onConnectError(e: Error)
    {
        console.error('*** Connection Error! ***');
        throw e;
    }

    public static get instance()
    {
        if (!Application._instance)
        {
            throw new Error('Application not defined');
        }

        return Application._instance;
    }

    public get doc()
    {
        return Document.instance;
    }

    public get project()
    {
        return Document.instance.project;
    }

    public get stage()
    {
        return this.pixiApp.stage;
    }

    public openProject(id: string)
    {
        this.dataStore.openProject(id).then((model) =>
        {
            console.log('model created!', model);
        }).catch((err) =>
        {
            console.error('no dice, buddy:', err);
        });
    }

    public onDocSync = (command: Command) =>
    {
        const output = `%c${command.getCommandType().replace('Command', '')}:\n%c${command.toString()}`;

        console.log(output, 'color:cyan;', 'color:white');

        this.undoStack.push(command);

        try
        {
            command.apply();
        }
        catch (e)
        {
            console.warn(`Command "${command.getCommandType()}" not implemented`);
        }
    };
}
