import { EventEmitter } from 'eventemitter3';
import { Application as PixiApplication } from 'pixi.js';

import type { Command } from './commands';
import { DataStore } from './sync/datastore';

export interface AppOptions
{
    canvas: HTMLCanvasElement;
}
export class Application extends EventEmitter
{
    public pixiApp: PixiApplication;
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
    }

    public async connect()
    {
        return this.dataStore.connect();
    }

    public async init()
    {
        // subclasses
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
}
