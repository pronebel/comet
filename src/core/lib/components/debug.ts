import { Sprite, Text, Texture } from 'pixi.js';

import { app } from '../../../editor/lib/app';
import { ModelSchema } from '../model/schema';
import type { ContainerComponent } from './container';
import type { SpriteModel } from './sprite';
import { schema as spriteSchema, SpriteComponent } from './sprite';

export interface DebugModel extends SpriteModel
{
    label: string;
}

export const schema = new ModelSchema<DebugModel>({
    ...spriteSchema.defaults,
    label: '',
}, {
    ...spriteSchema.constraints,
});

export class DebugComponent extends SpriteComponent<DebugModel, Sprite>
{
    public modelSchema(): ModelSchema<DebugModel>
    {
        return schema;
    }

    public createView(): Sprite
    {
        const sprite = new Sprite(Texture.WHITE);
        const label = new Text(this.id.replace('Component', ''), {
            fontSize: 10,
            fill: 0xffffff,
        });

        label.x = 20;
        label.y = 3;

        sprite.addChild(label);

        return sprite;
    }

    public updateView(): void
    {
        super.updateView();

        const textLabel = this.view.getChildAt(0) as Text;

        const { label } = this.values;

        textLabel.text = `${this.id.replace('Component', '')}${label ? `=${label}` : ''}`;
    }

    protected onAddedToParent(): void
    {
        super.onAddedToParent();

        app.makeInteractive(this as unknown as ContainerComponent);
    }
}
