import { type InteractionEvent, type Sprite, Container } from 'pixi.js';

import { app } from '../../../editor/lib/app';
import { startDrag } from '../../../editor/lib/drag';
import { SpriteComponent } from './sprite';

export class DebugComponent extends SpriteComponent
{
    public createView(): Sprite
    {
        const sprite = super.createView();

        sprite.interactive = true;

        sprite.on('mousedown', (e: InteractionEvent) =>
        {
            app.select(this);
            startDrag(this);
            e.stopPropagation();
        });

        const container = new Container();

        container.addChild(sprite);

        return container as Sprite;
    }

    public updateView(): void
    {
        const { tint, width, height } = this.model.values;

        super.updateView();

        const sprite = ((this.view as Container).children[0] as Sprite);

        sprite.tint = tint;
        sprite.width = width;
        sprite.height = height;
    }
}
