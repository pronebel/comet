// note: this file must be imported to trigger node type registration

import { EventEmitter } from 'eventemitter3';

import type { ClonableNode } from '../core/nodes/abstract/clonableNode';
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
import { EditorView } from './ui/editorView';

const userName = getUserName();
const userColor = getUserLogColor(userName);
const logId = `${userName}`;
const logStyle = 'color:LightCyan;';

export type AppEvents = 'commandExec';

export class Application extends EventEmitter<AppEvents>
{
    public datastore: Datastore;
    public nodeUpdater: NodeUpdater;
    public undoStack: UndoStack;
    public editorViews: EditorView[];
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

        this.editorViews = [];
        this.undoStack = new UndoStack(datastore);
        this.nodeUpdater = new NodeUpdater(datastore);

        this.init();
    }

    protected init()
    {
        initDiagnostics(this);
        initHistory();
        this.datastore.on('nodeRemoved', () => { writeUndoStack(); });
    }

    protected clear()
    {
        clearInstances();

        this.undoStack.clear();
        this.datastore.reset();
        this.editorViews.forEach((view) => view.reset());
    }

    public connect()
    {
        return this.datastore.connect();
    }

    public async createProject(name: string, id: string)
    {
        const { datastore } = this;

        this.clear();

        if (await datastore.hasProject(name))
        {
            await datastore.deleteProject(id);
        }

        const project = await datastore.createProject(name, id) as unknown as ProjectNode;

        this.initProject(project);
    }

    public async openProject(id: string)
    {
        this.clear();

        const project = await this.datastore.openProject(id) as unknown as ProjectNode;

        this.initProject(project);
    }

    protected initProject(project: ProjectNode)
    {
        this.project = project;
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

        this.emit('commandExec', command, result);

        return result as unknown as R;
    }

    public createEditorView(id: string)
    {
        const view = new EditorView(id, this.project);

        this.editorViews.push(view);

        return view;
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
