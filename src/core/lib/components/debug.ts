import type { InteractionEvent, Sprite } from 'pixi.js';

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

        return sprite;
    }
}
