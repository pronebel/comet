import { Graphics } from 'pixi.js';

import { degToRad } from '../../../core/util/geom';
import type { TransformGizmoFrame } from './frame';
import { RotateOperation } from './operations/rotate';

const rotationRadius = 30;

export class TransformGizmoInfo extends Graphics
{
    constructor(public readonly frame: TransformGizmoFrame)
    {
        super();

        this.visible = false;
    }

    public update()
    {
        const { frame: { gizmo: { operation } } } = this;

        this.clear();

        if (operation instanceof RotateOperation)
        {
            this.drawRotation();
        }
    }

    public drawRotation()
    {
        const { frame: { gizmo: { pivotGlobalPos, rotation } } } = this;
        const p0 = pivotGlobalPos;
        const p1 = { x: p0.x + rotationRadius, y: p0.y };

        this.lineStyle(1, 0xffff00, 1);
        this.beginFill(0xffff00, 0.2);
        this.moveTo(p0.x, p0.y);
        this.lineTo(p1.x, p1.y);
        this.arc(p0.x, p0.y, rotationRadius, 0, degToRad(rotation));
        this.lineTo(p0.x, p0.y);
        this.endFill();
    }
}
