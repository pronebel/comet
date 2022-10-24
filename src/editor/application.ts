// note: this file must be imported to trigger node type registration

import { EventEmitter } from 'eventemitter3';

import type { ClonableNode } from '../core/nodes/abstract/clonableNode';
import type { ContainerNode } from '../core/nodes/concrete/container';
import { ProjectNode } from '../core/nodes/concrete/project';
import { clearInstances, getInstance } from '../core/nodes/instances';
import { RemoveNodeCommand } from './commands/removeNode';
import type { Command } from './core/command';
import { initHistory, writeCommandList, writeUndoStack } from './core/history';
import UndoStack from './core/undoStack';
import { initDiagnostics } from './diagnostics';
import { Datastore } from './sync/datastore';
import { NodeUpdater } from './sync/nodeUpdater';
import { getUserLogColor, getUserName } from './sync/user';
import { EditableView } from './ui/editableView';

const userName = getUserName();
const userColor = getUserLogColor(userName);
const logId = `${userName}`;
const logStyle = 'color:LightCyan;';

export type AppEvents = '';

export class Application extends EventEmitter<AppEvents>
{
    public datastore: Datastore;
    public nodeUpdater: NodeUpdater;
    public undoStack: UndoStack;
    public editorView: EditableView;
    public project: ProjectNode;

    private static _instance: Application;

    public static get instance()
    {
        if (!Application._instance)
        {
            throw new Error('Application not defined');
        }

        return Application._instance;
    }

    constructor(public readonly options: {})
    {
        super();

        Application._instance = this;

        (window as any).app = this;

        this.project = new ProjectNode();

        const datastore = this.datastore = new Datastore();

        this.editorView = new EditableView(this.project as ContainerNode);

        this.undoStack = new UndoStack(datastore);
        this.nodeUpdater = new NodeUpdater(datastore);

        this.datastore.on('nodeRemoved', () => { writeUndoStack(); });

        initDiagnostics();
        initHistory();
    }

    public async connect()
    {
        await this.datastore.connect();

        setTimeout(() =>
        {
            this.createProject('Test', 'test');
        }, 100);
    }

    public async createProject(name: string, id: string)
    {
        const { datastore } = this;

        this.clear();

        if (await datastore.hasProject(name))
        {
            await datastore.deleteProject(id);
        }

        this.project = await datastore.createProject(name, id) as unknown as ProjectNode;
        this.init();
    }

    public async openProject(id: string)
    {
        this.clear();

        this.project = await this.datastore.openProject(id) as unknown as ProjectNode;
        this.init();
    }

    protected init()
    {
        this.editorView.setRoot(this.project);
    }

    protected clear()
    {
        clearInstances();

        this.undoStack.clear();
        this.datastore.reset();
        // this.editorViews.forEach((view) => view.reset());
    }

    public exec<R = unknown>(command: Command, isUndoRoot = true): R
    {
        command.isUndoRoot = isUndoRoot;

        writeCommandList(command.name);

        this.undoStack.push(command);

        if (localStorage['saveUndo'] !== '0')
        {
            writeUndoStack();
        }

        console.group(`%c${logId}:%c🔔 ${command.name}.run()`, userColor, `font-weight:bold;${logStyle}`);
        console.log(`%c${JSON.stringify(command.params)}`, 'color:#999');

        const result = command.run();

        console.groupEnd();

        return result as unknown as R;
    }

    public emit<T extends AppEvents>(event: T, ...args: any[]): boolean
    {
        console.log(`%c${logId}:%c✨ ${event}!`, userColor, logStyle);

        return EventEmitter.prototype.emit.call(this, event, ...args) as boolean;
    }

    public restoreNode(nodeId: string)
    {
        console.log(`%c${logId}:%cRestore node "${nodeId}"`, userColor, logStyle);

        const node = getInstance<ClonableNode>(nodeId);

        const dependencies = node.getRestoreDependencies();

        dependencies.filter((dependantNode) => dependantNode.isCloaked)
            .forEach((node) => new RemoveNodeCommand({ nodeId: node.id }).undo());
    }
}
