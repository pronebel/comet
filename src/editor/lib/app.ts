import type { Container, InteractionEvent } from 'pixi.js';
import { type IApplicationOptions, Application, filters, Sprite, Texture } from 'pixi.js';

import type { AnyComponent, SpawnMode } from '../../core/lib/component';
import type { ContainerComponent } from '../../core/lib/components/container';
import { DebugComponent } from '../../core/lib/components/debug';
import { EmptyComponent } from '../../core/lib/components/empty';
import { Scene } from '../../core/lib/scene';
import { startDrag } from './drag';

export let app: TestApp;

export class TestApp extends Application
{
    public selected?: ContainerComponent;
    public selection: Sprite;
    public scene: Scene;

    constructor(options?: IApplicationOptions | undefined)
    {
        super(options);

        this.scene = new Scene();

        this.stage.addChild(this.scene.root.view);

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
            width: 16,
            height: 16,
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
            this.scene.root.addChild(component);
        }

        this.makeInteractiveDeep(component);
        this.select(component);
        this.inspect();
    }

    public copy(spawnMode: SpawnMode)
    {
        if (this.selected)
        {
            const component = this.selected.copy<ContainerComponent>(spawnMode);

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

    public randAlpha()
    {
        if (this.selected)
        {
            this.selected.model.alpha = ((Math.random() * 70) + 30) / 100;
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

    public setCustomProp(value: any)
    {
        if (this.selected && this.selected instanceof DebugComponent)
        {
            this.selected.model.setCustomProperty('testCustomProp', value);
            this.selected.model.assignCustomProperty('label', 'testCustomProp');
        }
    }

    public removeCustomProp()
    {
        if (this.selected)
        {
            this.selected.model.removeCustomProperty('testCustomProp');
        }
    }

    public debug(element: HTMLPreElement)
    {
        let html = '';

        const componentId = (component: AnyComponent) => component.id.replace('Component', '');

        this.scene.root.walk((component, depth) =>
        {
            const pad = ''.padStart(depth, '+');
            const id = componentId(component);
            const modelId = component.model.id;
            const spawnerInfo = component.spawner
                ? `<span style="color:lime"><- ${componentId(component.spawner)}</span>`
                : '';
            const spawnedInfo = component.spawned.length > 0
                ? `<span style="color:green">-> [${component.spawned.length}] ${component.spawned
                    .map((component) => `${componentId(component)}`).join(',')}</span>`
                : '';
            const modelValues = JSON.stringify(component.model.ownValues).replace(/^{|}$/g, '');
            const modelLine = `${modelId} <span style="color:cyan;font-size:12px">${modelValues}</span>`;

            const isLinked = this.selected
                ? this.selected === component.spawner || component.spawned.includes(this.selected)
                : false;
            const spawnModeInfo = component.spawnMode.toUpperCase();

            const output = `${pad} ${id} ${spawnModeInfo} ${spawnerInfo} ${spawnedInfo}\n${pad}  ... ${modelLine}\n`;

            const line = component === this.selected ? `<b style="background-color:#222">${output}</b>` : output;

            html += isLinked ? `<span style="color:yellow;font-style:italic">${line}</span>` : line;
        }, false);

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
