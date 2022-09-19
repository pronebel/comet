import type {  Container,  InteractionEvent } from 'pixi.js';
import { filters, Sprite, Texture } from 'pixi.js';

import type { ModelBase, ModelValue } from '../../../core/lib/model/model';
import type { ClonableNode } from '../../../core/lib/nodes/abstract/clonableNode';
import type { CloneMode } from '../../../core/lib/nodes/cloneInfo';
import type { ContainerModel, ContainerNode } from '../../../core/lib/nodes/concrete/container';
import type { CustomPropertyType, CustomPropertyValueType } from '../../../core/lib/nodes/customProperties';
import { getGraphNode, registerGraphNodeType } from '../../../core/lib/nodes/factory';
import { type AppOptions, Application } from '../application';
import { AssignCustomPropCommand } from '../commands/assignCustomProp';
import { CloneCommand } from '../commands/clone';
import { CreateNodeCommand } from '../commands/createNode';
import { RemoveCustomPropCommand } from '../commands/removeCustomProp';
import { RemoveNodeCommand } from '../commands/removeNode';
import { SetCustomPropCommand } from '../commands/setCustomProp';
import { UnAssignCustomPropCommand } from '../commands/unassignCustomProp';
import { UnlinkCommand } from '../commands/unlink';
import { getUserName } from '../sync/user';
import { type DebugModel, DebugNode } from './debug';
import { startDrag } from './drag';

export let app: TestApp;

const userName = getUserName();

// must register any nodes outside of core
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
        if (userName === '!ali')
        {
            await this.createProject('Test', 'test');
        }
        else
        {
            await this.openProject('test');
        }

        this.deselect();
    }

    protected onObjectGraphNodeCreated(node: ClonableNode<ModelBase, object, string>): void
    {
        super.onObjectGraphNodeCreated(node);

        this.makeInteractive(node as unknown as ContainerNode);

        this.select(node as unknown as ContainerNode);
    }

    protected onObjectGraphNodeRemoved(nodeId: string, parentId: string): void
    {
        super.onObjectGraphNodeRemoved(nodeId, parentId);

        const parentNode = getGraphNode(parentId);

        if (parentNode)
        {
            this.select(parentNode as unknown as ContainerNode);
        }
    }

    protected onObjectGraphParentSet(childNode: ClonableNode<ModelBase, object, string>): void
    {
        this.select(childNode as unknown as ContainerNode);
    }

    protected onDatastoreCustomPropDefined(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        id: string,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        name: string,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        type: CustomPropertyType,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        value: CustomPropertyValueType,
    ): void
    {
        this.fitSelection();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected onDatastoreCustomPropUndefined(nodeId: string, propName: string): void
    {
        this.fitSelection();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected onDatastoreCustomPropAssigned(nodeId: string, modelKey: string, customKey: string): void
    {
        this.fitSelection();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected onDatastoreCustomPropUnAssigned(nodeId: string, modelKey: string): void
    {
        this.fitSelection();
    }

    protected onDatastoreNodeCloned(clonedNode: ClonableNode): void
    {
        this.select(clonedNode as unknown as ContainerNode);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected onDatastoreModelModified(nodeId: string, key: string, value: ModelValue): void
    {
        this.fitSelection();
    }

    // Button commands...

    public newContainer()
    {
        if (this.project && this.selected)
        {
            const parentId = this.selected.id;

            this.pushCommand(new CreateNodeCommand<ContainerModel>('Empty', {
                parent: parentId,
                model: {
                    x: 20,
                    y: 20,
                },
            }));
        }
    }

    public newChild()
    {
        if (this.project && this.selected)
        {
            const parentId = this.selected.id;

            this.pushCommand(new CreateNodeCommand<DebugModel>('Debug', {
                parent: parentId,
                model: {
                    x: 20,
                    y: 20,
                    width: 20,
                    height: 20,
                    tint: Math.round(Math.random() * 100000),
                },
            }));
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public clone(cloneMode: CloneMode)
    {
        if (this.project && this.selected)
        {
            this.pushCommand(new CloneCommand(this.selected.id, cloneMode));
        }
    }

    public unlink()
    {
        if (this.project && this.selected)
        {
            this.pushCommand(new UnlinkCommand(this.selected.id));
        }
    }

    public deleteSelected()
    {
        if (this.selected && this.selected.nodeType() !== 'Scene')
        {
            const parentNode = this.selected.parent;

            this.pushCommand(new RemoveNodeCommand(this.selected.id));

            if (parentNode)
            {
                this.select(parentNode as ContainerNode);
            }
        }
    }

    public inspect()
    {
        if (this.selected)
        {
            console.dir(this.selected);
            (window as any).$ = this.selected;
        }
    }

    public randColor()
    {
        if (this.selected && this.selected instanceof DebugNode)
        {
            this.selected.model.tint = Math.round(Math.random() * 100000);
        }
    }

    public randSize()
    {
        if (this.selected)
        {
            this.selected.model.width = Math.round(Math.random() * 50);
            this.selected.model.height = Math.round(Math.random() * 50);
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

            this.pushCommand(new SetCustomPropCommand(selected.id, name, propType, propValue));
        }
    }

    public removeCustomProp(name: string)
    {
        const { selected } = this;

        if (selected)
        {
            this.pushCommand(new RemoveCustomPropCommand(selected.id, name));
        }
    }

    public assignCustomProp(modelKey: string, customKey: string)
    {
        const { selected } = this;

        if (selected && selected instanceof DebugNode)
        {
            this.pushCommand(new AssignCustomPropCommand(selected.id, modelKey, customKey));
        }
    }

    public unAssignCustomProp(modelKey: string)
    {
        const { selected } = this;

        if (selected && selected instanceof DebugNode)
        {
            this.pushCommand(new UnAssignCustomPropCommand(selected.id, modelKey));
        }
    }

    public makeInteractiveDeep(rootNode: ContainerNode)
    {
        rootNode.walk((component) =>
        {
            this.makeInteractive(component as ContainerNode);
        });
    }

    public makeInteractive(component: ContainerNode)
    {
        const sprite = component.getView<Container>();

        if (!sprite.interactive)
        {
            sprite.interactive = true;

            sprite.on('mousedown', (e: InteractionEvent) =>
            {
                e.stopPropagation();

                this.select(component);
                startDrag(component);
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

            const componentId = (component: ContainerNode) => component.id.replace('Node', '');

            this.project.walk<ContainerNode>((component, options) =>
            {
                const {
                    model: { id: modelId },
                    cloneInfo, cloneInfo: { cloned, cloneMode },
                } = component;

                const cloner = cloneInfo.getCloner<ContainerNode>();

                const pad = ''.padStart(options.depth, '+');
                const id = `&lt;${componentId(component)}&gt;`;
                const modelInfo = `${modelId}`;
                const clonerInfo = cloner
                    ? `<span style="color:lime"><- ${componentId(cloner)}</span>`
                    : '';
                const clonedInfo = cloned.length > 0
                    ? `<span style="color:green">-> [${cloned.length}] ${cloned
                        .map((component) => `${componentId(component as unknown as ContainerNode)}`).join(',')}</span>`
                    : '';
                const modelValues = JSON.stringify(component.model.ownValues).replace(/^{|}$/g, '');
                const customProps = component.getCustomProps();
                const customPropArray: string[] = [];

                Array.from(customProps.keys()).forEach((key) =>
                {
                    const array = customProps.properties.get(key);

                    if (array)
                    {
                        customPropArray.push(array.map((prop, i) =>
                        {
                            const isActive = i === 0;
                            const creator = prop.creator as unknown as ContainerNode;
                            const creatorId = componentId(creator);
                            const isCreator = component === creator;

                            let line = `&lt;${creatorId}&gt;~"${prop.name}":${JSON.stringify(prop.value)}`;

                            line = isActive ? `<b>${line}</b>` : `<span style="font-style:italic">${line}</span>`;
                            line = isCreator ? `<span style="color:salmon">${line}</span>` : line;

                            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                            return line;
                        }).join(', '));
                    }
                });
                const customPropDefineInfo = customPropArray.join(' / ');
                const customPropAssignmentsArray: string[] = [];

                Array.from(component.customProperties.assignments.keys()).forEach((key) =>
                {
                    const customKey = component.customProperties.assignments.get(key);

                    customPropAssignmentsArray.push(`${key} -> ${customKey}`);
                });

                const modelLine = `${modelInfo} <span style="color:cyan;font-size:14px">${modelValues}</span>`;
                const isLinked = this.selected
                    ? this.selected === cloner || cloned.includes(this.selected)
                    : false;
                const cloneModeInfo = `${cloneMode.toUpperCase()}`;
                let output = `${pad} ${id} ${cloneModeInfo} ${clonerInfo} ${clonedInfo}\n`;

                output += `${pad}  ... ${modelLine}\n`;
                if (customPropDefineInfo.length)
                {
                    output += `${pad}  ... ${customPropDefineInfo} : ${customPropAssignmentsArray.join(', ')}\n`;
                }
                const line = component === this.selected ? `<b style="background-color:#222">${output}</b>` : output;

                html += isLinked ? `<span style="color:yellow;font-style:italic">${line}</span>` : line;
            }, {
                includeSelf: true,
            });

            element.innerHTML = html;
        }
    }
}
