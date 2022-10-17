import { type Container, type InteractionEvent, filters, Sprite, Texture } from 'pixi.js';

import { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import { type GraphNode, sortNodesByCreation } from '../../core/nodes/abstract/graphNode';
import type { CloneMode } from '../../core/nodes/cloneInfo';
import type { ContainerNode } from '../../core/nodes/concrete/container';
import type { ProjectNode } from '../../core/nodes/concrete/project';
import type { SpriteModel } from '../../core/nodes/concrete/sprite';
import type { CustomProperty } from '../../core/nodes/customProperties';
import { getInstance, getInstances, hasInstance } from '../../core/nodes/instances';
import { nodeFactoryEmitter, registerNodeType } from '../../core/nodes/nodeFactory';
import { createNodeSchema, getNodeSchema } from '../../core/nodes/schema';
import { type AppOptions, Application } from '../application';
import { AddChildCommand } from '../commands/addChild';
import { AssignCustomPropCommand } from '../commands/assignCustomProp';
import { type CloneCommandReturn, CloneCommand } from '../commands/clone';
import { ModifyModelCommand } from '../commands/modifyModel';
import { RemoveChildCommand } from '../commands/removeChild';
import { RemoveCustomPropCommand } from '../commands/removeCustomProp';
import { SetCustomPropCommand } from '../commands/setCustomProp';
import { UnAssignCustomPropCommand } from '../commands/unassignCustomProp';
import { UnlinkCommand } from '../commands/unlink';
import { Action } from '../core/action';
import { getUserLogColor, getUserName } from '../sync/user';
import { getUrlParam } from '../util';
import { startDrag } from './drag';
import { DebugNode } from './nodes/debug';

const userName = getUserName();
const userColor = getUserLogColor(userName);
const logStyle = `color:PaleTurquoise`;
const logId = `${userName}`;

// must register any nodes outside of core explicitly
registerNodeType(DebugNode);

export class DevTools
{
    public selected?: ContainerNode;
    public selection: Sprite;

    public static getInstance()
    {
        return Application.instance as unknown as DevTools;
    }

    constructor()
    {
        const selection = this.selection = new Sprite(Texture.WHITE);

        selection.tint = 0x00ffff;
        selection.visible = false;
        selection.filters = [new filters.BlurFilter(5)];
        this.selection.alpha = 0.33;

        this.stage.addChild(selection);

        this.initNodeFactoryEvents();
        this.initKeyboardActions();
    }

    protected onUndo(): void
    {
        this.fitSelection();
    }

    protected onRedo(): void
    {
        this.fitSelection();
    }

    protected initNodeFactoryEvents()
    {
        nodeFactoryEmitter.on('created', (node: ClonableNode) =>
        {
            console.log(`%c${logId}:%cCREATED: "${node.id}"`, userColor, logStyle);

            this.makeInteractive(node.cast<ContainerNode>());
            this.selectLastNode();
        }).on('disposed', (node: ClonableNode) =>
        {
            console.log(`%c${logId}:%cDISPOSED: "${node.id}"`, userColor, logStyle);

            throw new Error('disposed?');
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        }).on('modelModified', (node: ClonableNode, key: string, value: ModelValue, oldValue: ModelValue) =>
        {
            // const val = JSON.stringify(value);
            // const oldVal = JSON.stringify(oldValue);

            // console.log(`%c${logId}:MODIFIED: "${node.id}" [${key}]=${val} (${oldVal})`, logStyle);
            this.fitSelection(node.cast<ContainerNode>());
        })
            .on('childAdded', (node: ClonableNode) =>
            {
                console.log(`%c${logId}:%cCHILD ADDED: "${node.id}"`, userColor, logStyle);

                this.select(node.cast<ContainerNode>());
                this.fitSelection(node.cast<ContainerNode>());
            })
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
            .on('childRemoved', (node: ClonableNode) =>
            {
                console.log(`%c${logId}:%cCHILD REMOVED: "${node.id}"`, userColor, logStyle);

                this.selectLastNode();
            })
            .on('cloaked', (node: ClonableNode) =>
            {
                console.log(`%c${logId}:%cCLOAKED: "${node.id}"`, userColor, logStyle);

                this.selectLastNode();
            })
            .on('uncloaked', (node: ClonableNode) =>
            {
                console.log(`%c${logId}:%cUNCLOAKED: "${node.id}"`, userColor, logStyle);

                this.selectLastNode();
            });
    }

    protected initKeyboardActions()
    {
        Action.register('undo', this.undo, { hotkey: 'command+z,ctrl+z' });
        Action.register('redo', this.redo, { hotkey: 'command+shift+z,ctrl+shift+z' });
        Action.register('delete', () => this.deleteSelected(), { hotkey: 'delete,backspace' });
        Action.register('newChild', () => this.newChild(), { hotkey: 'command+n,ctrl+n' });
        Action.register('newEmpty', () => this.newContainer(), { hotkey: 'command+shift+n,ctrl+shift+n' });
    }

    public async init()
    {
        super.init();

        if (userName === 'ali' && getUrlParam<number>('open') !== 1)
        {
            await this.createProject('Test', 'test');
        }
        else
        {
            await this.openProject('test');
        }

        this.deselect();

        if (getUrlParam<number>('restore') === 1)
        {
            this.restoreDatastore();
        }

        if (localStorage['saveUndo'] === '0')
        {
            this.readUndoStack();
        }
    }

    protected resetState(): void
    {
        super.resetState();

        delete this.selected;
        this.selection.visible = false;
    }

    protected initProject(project: ProjectNode): void
    {
        super.initProject(project);

        this.stage.addChild(project.view);

        this.makeInteractiveDeep(project.cast<ContainerNode>());
    }

    protected selectLastNode()
    {
        const { project } = this;

        if (project)
        {
            const nodes = (getInstances()
                .filter((inst) => inst instanceof ClonableNode && this.project?.contains(inst)) as ContainerNode[])
                .filter((node) => project.contains(node) && !node.isCloaked)
                .sort(sortNodesByCreation);
            let node = nodes[nodes.length - 1];

            if (node && node.nodeType() === 'Project' && hasInstance('Scene:1'))
            {
                node = getInstance<ContainerNode>('Scene:1');
            }

            if (node)
            {
                this.select(node);
            }
        }
    }

    public saveDatastore()
    {
        const nodes = this.datastore.toJSON().nodes;

        localStorage['comet'] = JSON.stringify(nodes);
        console.log(`%c${logId}:%cDatastore saved`, userColor, logStyle);
    }

    public restoreDatastore()
    {
        const json = localStorage.getItem('comet');

        if (json)
        {
            const nodes = JSON.parse(json);

            console.clear();
            this.datastore.setNodesData(nodes);
            this.resetState();
            this.openProject('test');
        }
    }

    public newContainer()
    {
        if (this.project && this.selected)
        {
            const parentId = this.selected.id;

            const nodeSchema = createNodeSchema('Empty', {
                parent: parentId,
                model: {
                    x: 20,
                    y: 20,
                },
            });

            this.exec(new AddChildCommand({ parentId, nodeSchema }));
        }
    }

    public newChild()
    {
        if (this.project && this.selected)
        {
            const parentId = this.selected.id;

            const nodeSchema = createNodeSchema('Debug', {
                parent: parentId,
                model: {
                    x: 20,
                    y: 20,
                    width: 20,
                    height: 20,
                    tint: Math.round(Math.random() * 100000),
                },
            });

            this.exec(new AddChildCommand({ parentId, nodeSchema }));
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public clone(cloneMode: CloneMode)
    {
        if (this.project && this.selected)
        {
            const parentNode = this.selected.parent;
            const {
                clonedNode,
            } = this.exec<CloneCommandReturn>(new CloneCommand({
                parentId: parentNode ? parentNode.id : undefined,
                nodeId: this.selected.id,
                cloneMode,
            }));

            this.select(clonedNode.cast());
        }
    }

    public deleteSelected()
    {
        if (this.selected && (this.selected.nodeType() !== 'Scene' || this.selected?.nodeType() !== 'Project'))
        {
            this.exec(new RemoveChildCommand({ nodeId: this.selected.id }));
        }
    }

    public unlink()
    {
        if (this.project && this.selected)
        {
            this.exec(new UnlinkCommand({ nodeId: this.selected.id }));
        }
    }

    public inspect()
    {
        const { selected } = this;

        if (selected)
        {
            const cloneRoot = selected.getCloneRoot();

            const definedProps: Record<string, CustomProperty[]> = {};

            selected.getDefinedCustomProps().forEach((props, key) => { definedProps[key] = props; });

            const info = {
                id: selected.id,
                parent: selected.parent?.id,
                children: selected.children.map((node) => (node.id)),
                allChildren: selected.getAllChildren<ClonableNode>().map((node) => (node.id)),
                parents: selected.getParents().map((node) => (node.id)),
                dependants: selected.getDependants().map((node) => (node.id)),
                dependencies: selected.getDependencies().map((node) => (node.id)),
                restoreDependencies: selected.getRestoreDependencies().map((node) => (node.id)),
                original: selected.getOriginal().id,
                cloneTarget: selected.getCloneTarget().id,
                cloneRoot: cloneRoot ? cloneRoot.id : undefined,
                modifyCloneTarget: selected.getModificationCloneTarget().id,
                addChildCloneTarget: selected.getAddChildCloneTarget().id,
                clonedDescendants: selected.getClonedDescendants().map((node) => (node.id)),
                cloneAncestors: selected.getCloneAncestors().map((node) => (node.id)),
                cloneTreeAncestors: selected.getCloneTreeAncestors().map((node) => (node.id)),
                definedProps,
                nodeGraphSchema: getNodeSchema(selected.cast<ClonableNode>()),
                dsNodeSchema: this.datastore.getNodeElementSchema(selected.id),
            };

            console.clear();
            console.dir(selected);
            console.log(JSON.stringify(info, null, 4));

            (window as any).$ = selected;
        }
    }

    public inspectDatastore()
    {
        const data = this.datastore.toJSON();

        console.dir(data);
        console.log(JSON.stringify(data, null, 4));
    }

    public randColor()
    {
        if (this.selected && this.selected instanceof DebugNode)
        {
            this.exec(new ModifyModelCommand<SpriteModel>({
                nodeId: this.selected.getModificationCloneTarget().id,
                values: {
                    tint: Math.round(Math.random() * 100000),
                } }));
        }
    }

    public randSize()
    {
        if (this.selected)
        {
            this.exec(new ModifyModelCommand<SpriteModel>({
                nodeId: this.selected.getModificationCloneTarget().id,
                values: {
                    width: Math.round(Math.random() * 50),
                    height: Math.round(Math.random() * 50),
                } }));

            this.select(this.selected);
        }
    }

    public rotate()
    {
        if (this.selected)
        {
            this.selected.model.angle += 15;
            this.select(this.selected);
        }
    }

    public resetModel()
    {
        if (this.selected)
        {
            const nodeElement = this.datastore.getNodeElement(this.selected.id);

            nodeElement.get('model').value({});
            this.selected.model.reset();
            this.fitSelection(this.selected);
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public setCustomProp(name: string, value: any)
    {
        const { selected } = this;

        if (selected)
        {
            const propType = isNaN(value) ? 'string' : 'number';
            const propValue = propType === 'string' ? value : parseFloat(value);

            this.exec(new SetCustomPropCommand({
                nodeId: selected.id,
                customKey: name,
                type: propType,
                value: propValue,
                updateMode: 'full',
            }));
        }
    }

    public removeCustomProp(name: string)
    {
        const { selected } = this;

        if (selected)
        {
            this.exec(new RemoveCustomPropCommand({
                nodeId: selected.id,
                customKey: name,
                updateMode: 'full',
            }));
        }
    }

    public assignCustomProp(modelKey: string, customKey: string)
    {
        const { selected } = this;

        if (selected && selected instanceof DebugNode)
        {
            this.exec(new AssignCustomPropCommand({
                nodeId: selected.id,
                modelKey,
                customKey,
                updateMode: 'full',
            }));
        }
    }

    public unAssignCustomProp(modelKey: string)
    {
        const { selected } = this;

        if (selected && selected instanceof DebugNode)
        {
            this.exec(new UnAssignCustomPropCommand({
                nodeId: selected.id,
                modelKey,
                updateMode: 'full',
            }));
        }
    }

    public makeInteractiveDeep(rootNode: ContainerNode)
    {
        rootNode.walk((component) =>
        {
            this.makeInteractive(component as ContainerNode);
        });
    }

    public makeInteractive<T extends ContainerNode>(component: T)
    {
        const sprite = component.getView<Container>();

        (sprite as any).componentId = component.id;

        if (!sprite.interactive)
        {
            sprite.interactive = true;

            console.log(`%c${logId}:%cmake interactive "${component.id}"`, userColor, logStyle);
            sprite.on('mousedown', this.onSpriteClicked);
        }
    }

    public unmakeInteractive<T extends ContainerNode>(component: T)
    {
        const sprite = component.getView<Container>();

        if (sprite.interactive)
        {
            sprite.interactive = false;

            console.log(`%c${logId}:%cunmake interactive "${component.id}"`, userColor, logStyle);
            sprite.off('mousedown', this.onSpriteClicked);
        }
    }

    protected onSpriteClicked = (e: InteractionEvent) =>
    {
        e.stopPropagation();

        const component = getInstance<ContainerNode>((e.target as any).componentId);

        this.select(component);

        startDrag(component.cast());
    };

    public select(component: ContainerNode)
    {
        this.deselect();
        this.selected = component;
        this.selection.visible = true;
        this.fitSelection(component);
        (window as any).$ = component;
    }

    public deselect()
    {
        if (this.project)
        {
            const scene = this.project.getChildAt<ContainerNode>(0);

            this.selected = scene;
            this.selection.visible = false;
        }
    }

    public fitSelection(component?: ContainerNode)
    {
        if (!component)
        {
            component = this.selected;
        }

        if (component)
        {
            component.updateRecursive();

            const sprite = component.getView<Sprite>();

            const bounds = sprite.getBounds();

            this.selection.x = bounds.left;
            this.selection.y = bounds.top;
            this.selection.width = bounds.width;
            this.selection.height = bounds.height;
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public debug(element: HTMLPreElement)
    {
        if (this.project)
        {
            let html = '';

            const nodeId = (node?: GraphNode) => (node ? node.id.replace('Node', '') : '.');

            this.project.walk<ContainerNode>((node, options) =>
            {
                const {
                    model: { id: modelId },
                    cloneInfo, cloneInfo: { cloned, cloneMode },
                } = node;

                const cloner = cloneInfo.getCloner<ContainerNode>();

                const pad = ''.padStart(options.depth, '+');
                const id = `&lt;${nodeId(node)}&gt;(${nodeId(node.parent)})`;
                const modelInfo = `${modelId}`;
                const clonerInfo = cloner
                    ? `<span style="color:lime"><- ${nodeId(cloner)}</span>`
                    : '';
                const clonedInfo = cloned.length > 0
                    ? `<span style="color:green">-> [${cloned.length}] ${cloned
                        .map((component) => `${nodeId(component as unknown as ContainerNode)}`).join(',')}</span>`
                    : '';
                const modelValues = JSON.stringify(node.model.ownValues).replace(/^{|}$/g, '');

                const customPropsDefined: string[] = [];
                const customPropsAssigned: string[] = [];

                node.defineCustomProperties.forEach((prop, key) => { customPropsDefined.push(`${key}=${prop.value}`); });
                node.assignedCustomProperties.forEach((customKey, modelKey) =>
                {
                    customPropsAssigned.push(`${modelKey}->${customKey}`);
                });

                const modelLine = `${modelInfo} <span style="color:cyan;">${modelValues}</span>`;
                const isCloned = this.selected
                    ? this.selected === cloner || cloned.includes(this.selected)
                    : false;
                const cloneModeInfo = `${cloneMode.toUpperCase()}`;
                let output = `${pad} ${id} ${cloneModeInfo} ${clonerInfo} ${clonedInfo}\n`;

                output += `${pad}  ... ${modelLine}\n`;

                if (customPropsDefined.length || customPropsAssigned.length)
                {
                    output += `${pad}  ... `;

                    if (customPropsDefined.length)
                    {
                        output += `<span style="color:pink">${customPropsDefined}</span> `;
                    }
                    if (customPropsAssigned.length)
                    {
                        output += `<span style="color:orange">${customPropsAssigned}</span> `;
                    }

                    output += '\n';
                }

                const line = node === this.selected ? `<b style="background-color:#222">${output}</b>` : output;

                let final = isCloned ? `<span style="color:yellow;font-style:italic">${line}</span>` : line;

                final = node.isCloaked ? `<span style="opacity:0.7;font-style:italic">${line}</span>` : line;

                html += final;
            }, {
                includeSelf: true,
            });

            element.innerHTML = `${html}`;

            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            document.getElementById('undo')!.innerHTML = this.undoStack.debugPrint();
        }
    }
}
