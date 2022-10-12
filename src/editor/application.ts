// note: this file must be imported to trigger node type registration
import '../core/nodes/concrete';

import { EventEmitter } from 'eventemitter3';
import { Application as PixiApplication } from 'pixi.js';

import type { ClonableNode } from '../core/nodes/abstract/clonableNode';
import type { ProjectNode } from '../core/nodes/concrete/project';
import { clearInstances, getInstance } from '../core/nodes/instances';
import type { Command } from './command';
import { createCommand } from './commandFactory';
import { RemoveNodeCommand } from './commands/removeNode';
import { Datastore } from './sync/datastore';
import { NodeUpdater } from './sync/nodeUpdater';
import { getUserName } from './sync/user';
import UndoStack from './undoStack';

const userName = getUserName();
const logId = `${userName}:APPL`;
const logStyle = 'color:LightCyan;';

const localStorageUndoStackKey = `${userName}:undo`;

export const localStorageCommandsKey = `commandList`;

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

        const datastore = this.datastore = new Datastore();

        this.undoStack = new UndoStack(datastore);
        this.nodeUpdater = new NodeUpdater(datastore);

        this.initDatastoreEvents();
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

    protected initDatastoreEvents()
    {
        this.datastore.on('nodeRemoved', () => { this.writeUndoStack(); });
    }

    public undo = () =>
    {
        this.writeCommandList('undo');
        this.undoStack.undo();
        this.onUndo();
    };

    public redo = () =>
    {
        this.writeCommandList('redo');
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
        if (localStorage['saveUndo'] === '0')
        {
            localStorage['replayIndex'] = '0';
        }
        else
        {
            localStorage[localStorageCommandsKey] = '[]';
            localStorage.removeItem('replayIndex');
        }
    }

    public exec<R = unknown>(command: Command, isUndoRoot = true): R
    {
        command.isUndoRoot = isUndoRoot;

        this.writeCommandList(command.name);

        this.undoStack.push(command);

        if (localStorage['saveUndo'] !== '0')
        {
            this.writeUndoStack();
        }

        console.group(`%c${logId}:${command.name}.run()`, `font-weight:bold;${logStyle}`);
        console.log(`%c🔔${JSON.stringify(command.params)}`, logStyle);

        const result = command.run();

        console.groupEnd();

        this.emit('commandExec', command, result);

        return result as unknown as R;
    }

    public writeUndoStack()
    {
        const data = JSON.stringify(this.undoStack.toJSON(), null, 4);

        localStorage[localStorageUndoStackKey] = data;
    }

    public writeCommandList(commandName: string)
    {
        if (localStorage['saveUndo'] === '0')
        {
            return;
        }

        const commandList = JSON.parse(localStorage[localStorageCommandsKey] || '[]') as string[];

        commandList.push(`${userName}:${commandName}`);
        localStorage[localStorageCommandsKey] = JSON.stringify(commandList);
    }

    public readUndoStack(endIndex: number | undefined = undefined)
    {
        const data = localStorage[localStorageUndoStackKey];

        if (data)
        {
            const { undoStack } = this;
            let commandArray = JSON.parse(data) as any[];

            commandArray = commandArray.slice(0, endIndex === 0 ? undefined : endIndex);

            const commands = commandArray.map((commandJSON) =>
                createCommand(commandJSON));

            undoStack.stack.length = 0;
            undoStack.stack.push(...commands);
            undoStack.head = -1;
        }
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

    public restoreNode(nodeId: string)
    {
        console.log(`%c${logId}:Restore node "${nodeId}"`, logStyle);

        const node = getInstance<ClonableNode>(nodeId);

        const dependencies = node.getRestoreDependencies();

        dependencies.filter((dependantNode) => dependantNode.isCloaked)
            .forEach((node) => new RemoveNodeCommand({ nodeId: node.id }).undo());
    }
}
