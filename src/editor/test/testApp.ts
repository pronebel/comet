import type {  Container,  InteractionEvent } from 'pixi.js';
import { filters, Sprite, Texture } from 'pixi.js';

import { type GraphNode, sortNodesByCreation } from '../../core/nodes/abstract/graphNode';
import type { CloneMode } from '../../core/nodes/cloneInfo';
import type { ContainerNode } from '../../core/nodes/concrete/container';
import type { ProjectNode } from '../../core/nodes/concrete/project';
import type { SpriteModel } from '../../core/nodes/concrete/sprite';
import type { CustomProperty } from '../../core/nodes/customProperties';
import {  getLatestNode, registerGraphNodeType } from '../../core/nodes/nodeFactory';
import { type NodeSchema, createNodeSchema } from '../../core/nodes/schema';
import type { AbstractCommand } from '../abstractCommand';
import { type AppOptions, Application } from '../application';
import { AddChildCommand } from '../commands/addChild';
import { AssignCustomPropCommand } from '../commands/assignCustomProp';
import { type CloneCommandReturn, CloneCommand } from '../commands/clone';
import { ModifyModelCommand } from '../commands/modifyModel';
import { RemoveChildCommand } from '../commands/removeChild';
import { RemoveCustomPropCommand } from '../commands/removeCustomProp';
import { SetCustomPropCommand } from '../commands/setCustomProp';
import { SetParentCommand } from '../commands/setParent';
import { UnAssignCustomPropCommand } from '../commands/unassignCustomProp';
import { UnlinkCommand } from '../commands/unlink';
import { getUserName } from '../sync/user';
import { getUrlParam } from '../util';
import { DebugNode } from './debug';
import { startDrag } from './drag';

export let app: TestApp;

const userName = getUserName();

// must register any nodes outside of core explicitly
registerGraphNodeType(DebugNode);

export class TestApp extends Application
{
    public selected?: ContainerNode;
    public selection: Sprite;

    public static getInstance()
    {
        return Application.instance as unknown as TestApp;
    }

    constructor(options: AppOptions)
    {
        super(options);

        const selection = this.selection = new Sprite(Texture.WHITE);

        selection.tint = 0x00ffff;
        selection.visible = false;
        selection.filters = [new filters.BlurFilter(5)];
        this.selection.alpha = 0.33;

        this.stage.addChild(selection);
    }

    public async init()
    {
        if (userName === 'ali' && getUrlParam<number>('open') !== 1)
        {
            await this.createProject('Test', 'test');
        }
        else
        {
            await this.openProject('test');
        }

        this.deselect();
    }

    protected initProject(project: ProjectNode): void
    {
        super.initProject(project);

        this.stage.addChild(project.view);

        this.makeInteractiveDeep(project.cast<ContainerNode>());
    }

    protected onCommand(command: AbstractCommand<{}, void>, result: unknown): void
    {
        super.onCommand(command, result);

        const commandName = command.name;

        if (commandName === 'Clone')
        {
            const { clonedNode } = result as CloneCommandReturn;

            clonedNode.walk<ContainerNode>((node) =>
            {
                this.makeInteractive(node);
            });

            this.select(clonedNode.cast<ContainerNode>());
        }
        else if (commandName === 'RemoveNode')
        {
            const node = getLatestNode();

            if (node)
            {
                this.select(node.cast<ContainerNode>());
            }
        }
    }

    public saveDatastore()
    {
        const nodes = this.datastore.nodes.toJSON();

        localStorage['comet'] = JSON.stringify(nodes);
        console.log('Datastore saved', nodes);
    }

    public restoreDatastore(reload = true)
    {
        const json = localStorage.getItem('comet');

        if (json)
        {
            const nodes = JSON.parse(json);

            this.datastore.nodes.value(nodes);
            reload && window.location.reload();
        }
    }

    public clearDatastore()
    {
        this.datastore.nodes.keys().forEach((id) =>
        {
            if (id === 'Scene:1')
            {
                const nodeElement = this.datastore.getNodeElement(id);

                nodeElement.get('children').value([]);
            }
            else if (id !== 'Project:1' && id !== 'Scene:1')
            {
                this.datastore.nodes.remove(id);
            }
        });

        window.location.reload();
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

            const { nodes } = new AddChildCommand({ parentId, nodeSchema }).exec();

            nodes.forEach((node) =>
            {
                const asContainerNode = node.cast<ContainerNode>();

                this.makeInteractive(asContainerNode);
                this.select(asContainerNode);
            });
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

            const { nodes } = new AddChildCommand({ parentId, nodeSchema }).exec();

            nodes.forEach((node) =>
            {
                const asContainerNode = node.cast<ContainerNode>();

                this.makeInteractive(asContainerNode);
                this.select(asContainerNode);
            });
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public clone(cloneMode: CloneMode)
    {
        if (this.project && this.selected)
        {
            const parentNode = this.selected.parent;
            const {
                sourceNode,
                clonedNode,
            } = this.exec<CloneCommandReturn>(new CloneCommand({ nodeId: this.selected.id, cloneMode }));

            if (parentNode)
            {
                this.exec(new SetParentCommand({ parentId: parentNode.id, childId: clonedNode.id }));
                this.exec(new ModifyModelCommand({ nodeId: clonedNode.id, values: sourceNode.model.ownValues }));
                this.select(clonedNode.cast());
            }
        }
    }

    public deleteSelected()
    {
        if (this.selected && (this.selected.nodeType() !== 'Scene' || this.selected?.nodeType() !== 'Project'))
        {
            new RemoveChildCommand({ nodeId: this.selected.id }).exec();
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
                cloneTarget: selected.getCloneTarget().id,
                cloneRoot: cloneRoot ? cloneRoot.id : undefined,
                original: selected.getOriginal().id,
                addChildCloneTarget: selected.getAddChildCloneTarget().id,
                removeChildCloneTarget: selected.getRemoveChildCloneTarget().id,
                cloned: selected.getAllCloned().map((node) => node.id),
                ancestors: selected.getCloneAncestors().map((node) => node.id),
                definedProps,
            };

            console.log(JSON.stringify(info, null, 4));

            (window as any).$ = selected;
        }
    }

    public inspectDatastore()
    {
        const data: Record<string, NodeSchema<{}>> = this.datastore.nodes.toJSON();
        const nodes = Object.keys(data).map((id) => data[id]);

        nodes.sort(sortNodesByCreation);

        const info = nodes.map((node) =>
            ({
                id: node.id,
                parent: node.parent,
                children: node.children,
                cloner: node.cloneInfo.cloner,
                cloned: node.cloneInfo.cloned,
            }));

        console.log(JSON.stringify(info, null, 4));
    }

    public randColor()
    {
        if (this.selected && this.selected instanceof DebugNode)
        {
            this.exec(new ModifyModelCommand<SpriteModel>({
                nodeId: this.selected.getRemoveChildCloneTarget().id,
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
                nodeId: this.selected.getRemoveChildCloneTarget().id,
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

        if (!sprite.interactive)
        {
            sprite.interactive = true;

            sprite.on('mousedown', (e: InteractionEvent) =>
            {
                e.stopPropagation();

                this.select(component);

                const original = component.getRemoveChildCloneTarget();

                startDrag(original.cast());
            });
        }
    }

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

                html += isCloned ? `<span style="color:yellow;font-style:italic">${line}</span>` : line;
            }, {
                includeSelf: true,
            });

            element.innerHTML = html;
        }
    }
}
