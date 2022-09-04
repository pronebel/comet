import type { Container, InteractionEvent } from 'pixi.js';
import { type IApplicationOptions, Application, filters, Sprite, Texture } from 'pixi.js';

import type { CloneMode } from '../../core/lib/clone';
import type { AnyComponent } from '../../core/lib/component';
import type { ContainerComponent } from '../../core/lib/components/container';
import { DebugComponent } from '../../core/lib/components/debug';
import { EmptyComponent } from '../../core/lib/components/empty';
import { Project } from '../../core/lib/project';
import { Scene } from '../../core/lib/scene';
import { startDrag } from './drag';

export let app: TestApp;

export class TestApp extends Application
{
    public selected?: ContainerComponent;
    public selection: Sprite;
    public project: Project;
    public scene: Scene;

    constructor(options?: IApplicationOptions | undefined)
    {
        super(options);

        this.project = new Project();
        this.scene = new Scene();

        this.project.addChild(this.scene);

        this.stage.addChild(this.scene.view);

        const selection = this.selection = new Sprite(Texture.WHITE);

        selection.tint = 0x00ffff;
        selection.visible = false;
        selection.filters = [new filters.BlurFilter(5)];
        this.selection.alpha = 0.33;

        this.stage.addChild(selection);
    }

    public newContainer()
    {
        const empty = new EmptyComponent({
            x: 20,
            y: 20,
        });

        this.addComponent(empty);
    }

    public newChild()
    {
        const component = new DebugComponent({
            x: 20,
            y: 20,
            width: 20,
            height: 20,
            tint: Math.round(Math.random() * 100000),
        });

        this.addComponent(component as unknown as ContainerComponent);
    }

    public addComponent(component: ContainerComponent)
    {
        if (this.selected)
        {
            this.selected.addChild(component);
        }
        else
        {
            this.scene.addChild(component);
        }

        this.makeInteractiveDeep(component);
        this.select(component);
        this.inspect();
    }

    public clone(cloneMode: CloneMode): ContainerComponent | undefined
    {
        if (this.selected)
        {
            const component = this.selected.clone<ContainerComponent>(cloneMode);

            delete this.selected;

            this.addComponent(component);

            return component;
        }

        return undefined;
    }

    public makeInteractiveDeep(rootComponent: ContainerComponent)
    {
        rootComponent.walk((component) =>
        {
            this.makeInteractive(component as ContainerComponent);
        });
    }

    public makeInteractive(component: ContainerComponent)
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

    public select(component: ContainerComponent)
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

    public fitSelection(component: AnyComponent)
    {
        const sprite = component.getView<Sprite>();
        const bounds = sprite.getBounds();

        this.selection.x = bounds.left;
        this.selection.y = bounds.top;
        this.selection.width = bounds.width;
        this.selection.height = bounds.height;
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
        if (this.selected && this.selected instanceof DebugComponent)
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

            selected.defineCustomProperty(name, propType, propType === 'string' ? value : parseFloat(value));
        }
    }

    public removeCustomProp(name: string)
    {
        const { selected } = this;

        if (selected)
        {
            selected.unDefineCustomProperty(name);
        }
    }

    public assignCustomProp()
    {
        if (this.selected && this.selected instanceof DebugComponent)
        {
            // this.selected.assignCustomProperty('label', 'testCustomProp');
        }
    }

    public unAssignCustomProp()
    {
        if (this.selected && this.selected instanceof DebugComponent)
        {
            // this.selected.unAssignCustomProperty('label');
        }
    }

    public getAssignedCustomProp()
    {
        if (this.selected && this.selected instanceof DebugComponent)
        {
            // const propValue = this.selected.model.getAssignedCustomPropertyValue('label');

            // console.log(propValue);
        }
    }

    public debug(element: HTMLPreElement)
    {
        let html = '';

        const componentId = (component: AnyComponent) => component.id.replace('Component', '');

        this.scene.walk<AnyComponent>((component, options) =>
        {
            const {
                model: { id: modelId },
                cloneInfo: { cloner, cloned: cloneed, cloneMode },
            } = component;

            const pad = ''.padStart(options.depth, '+');
            const id = `&lt;${componentId(component)}&gt;`;
            const modelInfo = `${modelId}`;
            const clonerInfo = cloner
                ? `<span style="color:lime"><- ${componentId(cloner)}</span>`
                : '';
            const cloneedInfo = cloneed.length > 0
                ? `<span style="color:green">-> [${cloneed.length}] ${cloneed
                    .map((component) => `${componentId(component)}`).join(',')}</span>`
                : '';
            const modelValues = JSON.stringify(component.model.ownValues).replace(/^{|}$/g, '');
            const customProps = component.getDefinedCustomProps();
            const customPropArray: string[] = [];

            Array.from(customProps.keys()).forEach((key) =>
            {
                const array = customProps.properties.get(key);

                if (array)
                {
                    customPropArray.push(array.map((prop, i) =>
                    {
                        const isActive = i === 0;
                        const creatorId = componentId(prop.creator);
                        const isCreator = component === prop.creator;

                        let line = `${prop.name}~${creatorId}:${JSON.stringify(prop.value)}`;

                        line = isActive ? `<u>${line}</u>` : `<span style="font-style:italic">${line}</span>`;
                        line = isCreator ? `<span style="color:salmon">${line}</span>` : line;

                        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                        return line;
                    }).join(', '));
                }
            });
            const customPropDefineInfo = customPropArray.join(' / ');
            const modelLine = `${modelInfo} <span style="color:cyan;font-size:14px">${modelValues}</span>`;
            const isLinked = this.selected
                ? this.selected === cloner || cloneed.includes(this.selected)
                : false;
            const cloneModeInfo = `${cloneMode.toUpperCase()}`;
            let output = `${pad} ${id} ${cloneModeInfo} ${clonerInfo} ${cloneedInfo}\n`;

            output += `${pad}  ... ${modelLine}\n`;
            output += `${pad}  ... ${customPropDefineInfo}\n`;
            const line = component === this.selected ? `<b style="background-color:#222">${output}</b>` : output;

            html += isLinked ? `<span style="color:yellow;font-style:italic">${line}</span>` : line;
        }, {
            includeSelf: false,
        });

        element.innerHTML = html;
    }
}

export function createApp(canvas: HTMLCanvasElement)
{
    app = new TestApp({
        view: canvas,
        resizeTo: canvas,
        backgroundColor: 0x333333,
    });
}
