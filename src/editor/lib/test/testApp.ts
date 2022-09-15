import type {  Container,  InteractionEvent } from 'pixi.js';
import { filters, Sprite, Texture } from 'pixi.js';

import type { CloneMode } from '../../../core/lib/node/cloneInfo';
import type { ContainerNode } from '../../../core/lib/node/types/container';
// import { EmptyNode } from '../../../core/lib/node/types/empty';
import { type AppOptions, Application } from '../application';
import { type DebugModel, DebugNode } from './debug';
import { startDrag } from './drag';

export let app: TestApp;

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
        const { dataStore } = this;

        if (await dataStore.hasProject('test'))
        {
            await dataStore.deleteProject('test');
        }
        await dataStore.createProject('test');
    }

    public newContainer()
    {
        // const empty = new EmptyNode({
        //     model: {
        //         x: 20,
        //         y: 20,
        //     },
        // });

        // this.addNode(empty);
    }

    public newChild()
    {
        // const component = new DebugNode({
        //     model: {
        //         x: 20,
        //         y: 20,
        //         width: 20,
        //         height: 20,
        //         tint: Math.round(Math.random() * 100000),
        //     },
        // });

        // this.addNode(component as unknown as ContainerNode);
    }

    public addNode(component: ContainerNode)
    {
        if (this.selected)
        {
            this.selected.addChild(component);
        }
        else
        {
            // this.project.getChildAt(0).addChild(component);
        }

        this.makeInteractiveDeep(component);
        this.select(component);
        this.inspect();
    }

    public clone(cloneMode: CloneMode): ContainerNode | undefined
    {
        if (this.selected)
        {
            const component = this.selected.clone(cloneMode) as unknown as ContainerNode;

            delete this.selected;

            this.addNode(component);

            return component;
        }

        return undefined;
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
    }

    public deselect()
    {
        delete this.selected;
        this.selection.visible = false;
    }

    public fitSelection(component?: ContainerNode)
    {
        if (!component)
        {
            component = this.selected;
        }

        if (component)
        {
            const sprite = component.getView<Sprite>();
            const bounds = sprite.getBounds();

            this.selection.x = bounds.left;
            this.selection.y = bounds.top;
            this.selection.width = bounds.width;
            this.selection.height = bounds.height;
        }
    }

    public unlink()
    {
        if (this.selected)
        {
            this.selected.unlink();
        }
    }

    public deleteSelected()
    {
        if (this.selected)
        {
            this.selected.deleteSelf();
            delete this.selected;
            this.selection.visible = false;
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

    public inspect()
    {
        if (this.selected)
        {
            console.dir(this.selected);
            (window as any).$ = this.selected;
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public setCustomProp(name: string, value: any)
    {
        const { selected } = this;

        if (selected)
        {
            const propType = isNaN(value) ? 'string' : 'number';

            selected.setCustomProperty(name, propType, propType === 'string' ? value : parseFloat(value));
        }
    }

    public removeCustomProp(name: string)
    {
        const { selected } = this;

        if (selected)
        {
            selected.removeCustomProperty(name);
        }
    }

    public assignCustomProp(modelKey: string, customKey: string)
    {
        if (this.selected && this.selected instanceof DebugNode)
        {
            this.selected.assignCustomProperty(modelKey as keyof DebugModel, customKey);
        }
    }

    public unAssignCustomProp(modelKey: string)
    {
        if (this.selected && this.selected instanceof DebugNode)
        {
            this.selected.unAssignCustomProperty(modelKey as keyof DebugModel);
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public debug(element: HTMLPreElement)
    {
        // let html = '';

        // const componentId = (component: ContainerNode) => component.id.replace('Node', '');

        // this.project.walk<ContainerNode>((component, options) =>
        // {
        //     const {
        //         model: { id: modelId },
        //         cloneInfo, cloneInfo: { cloned, cloneMode },
        //     } = component;

        //     const cloner = cloneInfo.getCloner<ContainerNode>();

        //     const pad = ''.padStart(options.depth, '+');
        //     const id = `&lt;${componentId(component)}&gt;`;
        //     const modelInfo = `${modelId}`;
        //     const clonerInfo = cloner
        //         ? `<span style="color:lime"><- ${componentId(cloner)}</span>`
        //         : '';
        //     const clonedInfo = cloned.length > 0
        //         ? `<span style="color:green">-> [${cloned.length}] ${cloned
        //             .map((component) => `${componentId(component as unknown as ContainerNode)}`).join(',')}</span>`
        //         : '';
        //     const modelValues = JSON.stringify(component.model.ownValues).replace(/^{|}$/g, '');
        //     const customProps = component.getCustomProps();
        //     const customPropArray: string[] = [];

        //     Array.from(customProps.keys()).forEach((key) =>
        //     {
        //         const array = customProps.properties.get(key);

        //         if (array)
        //         {
        //             customPropArray.push(array.map((prop, i) =>
        //             {
        //                 const isActive = i === 0;
        //                 const creator = prop.creator as unknown as ContainerNode;
        //                 const creatorId = componentId(creator);
        //                 const isCreator = component === creator;

        //                 let line = `&lt;${creatorId}&gt;~"${prop.name}":${JSON.stringify(prop.value)}`;

        //                 line = isActive ? `<b>${line}</b>` : `<span style="font-style:italic">${line}</span>`;
        //                 line = isCreator ? `<span style="color:salmon">${line}</span>` : line;

        //                 // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        //                 return line;
        //             }).join(', '));
        //         }
        //     });
        //     const customPropDefineInfo = customPropArray.join(' / ');
        //     const customPropAssignmentsArray: string[] = [];

        //     Array.from(component.customProperties.assignments.keys()).forEach((key) =>
        //     {
        //         const customKey = component.customProperties.assignments.get(key);

        //         customPropAssignmentsArray.push(`${key} -> ${customKey}`);
        //     });

        //     const modelLine = `${modelInfo} <span style="color:cyan;font-size:14px">${modelValues}</span>`;
        //     const isLinked = this.selected
        //         ? this.selected === cloner || cloned.includes(this.selected)
        //         : false;
        //     const cloneModeInfo = `${cloneMode.toUpperCase()}`;
        //     let output = `${pad} ${id} ${cloneModeInfo} ${clonerInfo} ${clonedInfo}\n`;

        //     output += `${pad}  ... ${modelLine}\n`;
        //     output += `${pad}  ... ${customPropDefineInfo} : ${customPropAssignmentsArray.join(', ')}\n`;
        //     const line = component === this.selected ? `<b style="background-color:#222">${output}</b>` : output;

        //     html += isLinked ? `<span style="color:yellow;font-style:italic">${line}</span>` : line;
        // }, {
        //     includeSelf: true,
        // });

        // element.innerHTML = html;
    }
}
