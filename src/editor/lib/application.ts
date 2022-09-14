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
    public project: ProjectNode;
    public dataStore: DataStore;

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

        this.dataStore = new DataStore();

        const document = this.document = new Document(new Sync());

        document.sync.on('sync', this.onDocSync);

        const project = this.project = new ProjectNode();

        this.stage.addChild(project.view);
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

    public onDocSync = (command: Command) =>
    {
        const output = `%c${command.getCommandType().replace('Command', '')}:\n%c${command.toString()}`;

        console.log(output, 'color:cyan;', 'color:white');
    };
}
