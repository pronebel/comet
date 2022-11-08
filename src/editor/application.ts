import { Cache } from '../core/cache';
import { getGlobalEmitter } from '../core/events';
import type { ClonableNode } from '../core/nodes/abstract/clonableNode';
import type { ContainerNode } from '../core/nodes/concrete/container';
import { ProjectNode } from '../core/nodes/concrete/project';
import { clearInstances, getInstance } from '../core/nodes/instances';
import { newDebugNode } from './actions/newDebugNode';
import { CreateTextureAssetCommand } from './commands/createTextureAsset';
import { RemoveNodeCommand } from './commands/removeNode';
import { initHistory, writeUndoStack } from './core/history';
import UndoStack from './core/undoStack';
import type { DatastoreNodeEvent } from './events';
import { LocalStorageProvider } from './storage/localStorageProvider';
import { ConvergenceDatastore } from './sync/convergenceDatastore';
import { RemoteObjectSync } from './sync/remoteObjectSync';
import { getUserLogColor, getUserName } from './sync/user';
import { EditableView } from './ui/editableView';
import { getUrlParam } from './util';

const globalEmitter = getGlobalEmitter<DatastoreNodeEvent>();

const userName = getUserName();
const userColor = getUserLogColor(userName);
const logId = `${userName}`;
const logStyle = 'color:LightCyan;';

export type AppOptions = {};

export class Application
{
    public datastore: ConvergenceDatastore;
    public nodeUpdater: RemoteObjectSync;
    public undoStack: UndoStack;
    public editorView: EditableView;
    public storageProvider: LocalStorageProvider;
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

    constructor(public readonly options: AppOptions)
    {
        Application._instance = this;

        (window as any).app = this;

        const datastore = this.datastore = new ConvergenceDatastore();

        this.storageProvider = new LocalStorageProvider();
        this.project = new ProjectNode();
        this.editorView = new EditableView(this.project.cast<ContainerNode>());
        this.undoStack = new UndoStack();
        this.nodeUpdater = new RemoteObjectSync(datastore);

        Cache.textures.fetchProvider = (storageKey: string) =>
            this.storageProvider.download(storageKey);

        globalEmitter.on('datastore.node.removed', () =>
        {
            writeUndoStack();
        });

        initHistory();
    }

    public async connect()
    {
        await this.datastore.connect();
    }

    public async init()
    {
        if (getUrlParam<number>('open') === 1)
        {
            await this.openProject('test');
        }
        else
        {
            await this.createProject('Test', 'test');
        }
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
        this.initProject();
    }

    public async openProject(id: string)
    {
        this.clear();

        this.project = await this.datastore.openProject(id) as unknown as ProjectNode;
        this.initProject();
    }

    protected initProject()
    {
        this.editorView.setRoot(this.project.cast<ContainerNode>());
    }

    protected clear()
    {
        clearInstances();

        this.undoStack.clear();
        this.datastore.reset();
    }

    public restoreNode(nodeId: string)
    {
        console.log(`%c${logId}:%cRestore node "${nodeId}"`, userColor, logStyle);

        const node = getInstance<ClonableNode>(nodeId);

        const dependencies = node.getRestoreDependencies();

        dependencies.filter((dependantNode) => dependantNode.isCloaked)
            .forEach((node) => new RemoveNodeCommand({ nodeId: node.id }).undo());
    }

    public createTexture(file: File)
    {
        const { promise } = new CreateTextureAssetCommand({ file }).run();

        promise.then((texture) =>
        {
            newDebugNode({
                textureAssetId: texture.id,
                tint: 0xffffff,
            });
        });
    }
}
