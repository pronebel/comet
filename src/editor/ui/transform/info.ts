import { Graphics } from 'pixi.js';

import type { TransformGizmoFrame } from './frame';

export class TransformGizmoInfo extends Graphics
{
    constructor(public readonly gizmo: TransformGizmoFrame)
    {
        super();

        this.visible = false;
    }

    public update()
    {

    }
}
