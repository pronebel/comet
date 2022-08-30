import { type IApplicationOptions, Application, filters, Sprite, Texture } from 'pixi.js';

import type { AnyComponent } from '../../core/lib/component';
import { DebugComponent } from '../../core/lib/components/debug';
import { GroupComponent } from '../../core/lib/components/group';

export let app: TestApp;

export class TestApp extends Application
{
    public selected?: DebugComponent;
    public selection: Sprite;
    public group: GroupComponent;

    constructor(options?: IApplicationOptions | undefined)
    {
        super(options);

        this.group = new GroupComponent({
            x: 0,
            y: 0,
        });
        this.stage.addChild(this.group.view);

        const selection = this.selection = new Sprite(Texture.WHITE);

        selection.tint = 0x00ffff;
        selection.visible = false;
        selection.filters = [new filters.BlurFilter(5)];
        this.selection.alpha = 0.33;

        this.stage.addChild(selection);
    }

    public newComponent()
    {
        const component = new DebugComponent({
            x: 20,
            y: 20,
            width: 20,
            height: 20,
        });

        this.addComponent(component);
        this.inspect();
    }

    public addComponent(component: DebugComponent)
    {
        if (this.selected)
        {
            this.selected.addChild(component);
        }
        else
        {
            this.group.addChild(component);
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
            (window as any).foo = this.selected;
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
