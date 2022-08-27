import { type IApplicationOptions, Application, Container, filters, Sprite, Texture } from 'pixi.js';
import type { AnyComponent } from 'src/core/lib/component';

import type { DebugComponent } from '../../core/lib/components/debug';

export let app: App;

export class App extends Application
{
    public selected?: DebugComponent;
    public selection: Sprite;
    public container: Container;

    constructor(options?: IApplicationOptions | undefined)
    {
        super(options);

        this.container = new Container();
        this.stage.addChild(this.container);

        const selection = this.selection = new Sprite(Texture.WHITE);

        selection.tint = 0x00ffff;
        selection.visible = false;
        selection.filters = [new filters.BlurFilter(5)];
        this.selection.alpha = 0.33;

        this.stage.addChild(selection);
    }

    public addComponent(component: DebugComponent)
    {
        if (this.selected)
        {
            this.selected.addChild(component);
        }
        else
        {
            this.container.addChild(component.view);
        }
        this.select(component);
    }

    public select(component: DebugComponent)
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

    public copy(linked: boolean)
    {
        if (this.selected)
        {
            const component = this.selected.copy<DebugComponent>(linked);

            delete this.selected;
            this.addComponent(component);

            return component;
        }

        return undefined;
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

    public resetModel()
    {
        if (this.selected)
        {
            this.selected.model.reset();
            this.fitSelection(this.selected);
        }
    }
}

export function createApp(canvas: HTMLCanvasElement)
{
    app = new App({
        view: canvas,
        resizeTo: canvas,
        backgroundColor: 0x333333,
    });
}
