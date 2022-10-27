// import { EventEmitter } from 'eventemitter3';
import { Graphics } from 'pixi.js';

export class TransformGizmoHandle extends Graphics
{
    constructor(size: number)
    {
        super();

        this.interactive = true;

        this.lineStyle(1, 0x000000, 0.5);
        this.beginFill(0xffffff, 1);
        this.drawRect(0, 0, size, size);
        this.endFill();

        this.pivot.x = size * 0.5;
        this.pivot.y = size * 0.5;

        this.cursor = 'crosshair';
    }
}
