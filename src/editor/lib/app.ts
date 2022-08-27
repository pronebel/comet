import { type IApplicationOptions, Application, filters, Sprite, Texture } from 'pixi.js';

import type { DebugComponent } from '../../core/lib/components/debug';

export let app: App;

export class App extends Application
{
    public selected?: DebugComponent;
    public selection: Sprite;

    constructor(options?: IApplicationOptions | undefined)
    {
        super(options);

        const selection = this.selection = new Sprite(Texture.WHITE);

        this.stage.sortableChildren = true;

        selection.tint = 0xffffff;
        selection.visible = false;
        // selection.filters = [new filters.BlurFilter(5)];
        this.selection.alpha = 0.33;
        selection.zIndex = 10000;
        this.stage.addChild(selection);
    }

    public addComponent(component: DebugComponent)
    {
        if (this.selected)
        {
            this.selected.addChild(component);
        }
        this.select(component);
    }

    public select(component: DebugComponent)
    {
        this.deselect();
        this.selected = component;

        console.log(component.id, component.model.values, component.model.ownValues);

        const sprite = component.getView<Sprite>();
        const bounds = sprite.getBounds();

        this.selection.x = bounds.left;
        this.selection.y = bounds.top;
        this.selection.width = component.model.getValue<number>('width');
        this.selection.height = component.model.getValue<number>('height');
        this.selection.visible = true;
    }

    public deselect()
    {
        delete this.selected;
        this.selection.visible = false;
    }

    public copy(linked: boolean)
    {
        if (this.selected)
        {
            const component = this.selected.copy<DebugComponent>(linked);

            component.model.setValues({
                x: 30,
                y: 30,
            });

            this.addComponent(component);
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
}

export function createApp(canvas: HTMLCanvasElement)
{
    app = new App({
        view: canvas,
        resizeTo: canvas,
        backgroundColor: 0x333333,
    });
}
