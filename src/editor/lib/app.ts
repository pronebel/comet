import type { Container, InteractionEvent } from 'pixi.js';
import { type IApplicationOptions, Application, filters, Sprite, Texture } from 'pixi.js';

import type { AnyComponent, SpawnMode } from '../../core/lib/component';
import { ContainerComponent } from '../../core/lib/components/container';
import { DebugComponent } from '../../core/lib/components/debug';
import { EmptyComponent } from '../../core/lib/components/empty';
import { startDrag } from './drag';

export let app: TestApp;

export type AnyContainer = ContainerComponent<any, any>;

export class TestApp extends Application
{
    public selected?: AnyContainer;
    public selection: Sprite;
    public root: EmptyComponent;

    constructor(options?: IApplicationOptions | undefined)
    {
        super(options);

        this.root = new ContainerComponent({
            x: 0,
            y: 0,
        });

        this.stage.addChild(this.root.view);

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

        this.addComponent(component);
    }

    public addComponent(component: AnyContainer)
    {
        if (this.selected)
        {
            this.selected.addChild(component);
        }
        else
        {
            this.root.addChild(component);
        }

        this.makeInteractiveDeep(component);
        this.select(component);
        this.inspect();
    }

    public copy(spawnMode: SpawnMode)
    {
        if (this.selected)
        {
            const component = this.selected.copy<AnyContainer>(spawnMode);

            delete this.selected;

            this.addComponent(component);

            return component;
        }

        return undefined;
    }

    public makeInteractiveDeep(rootComponent: AnyContainer)
    {
        rootComponent.walk((component) =>
        {
            this.makeInteractive(component as AnyContainer);
        });
    }

    public makeInteractive(component: AnyContainer)
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

    public select(component: AnyContainer)
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
        if (this.selected)
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
        if (this.selected)
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
}

export function createApp(canvas: HTMLCanvasElement)
{
    app = new TestApp({
        view: canvas,
        resizeTo: canvas,
        backgroundColor: 0x333333,
    });
}
