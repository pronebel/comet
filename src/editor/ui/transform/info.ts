import { Container } from 'pixi.js';

import type { TransformGizmoFrame } from './frame';

export class TransformGizmoInfo extends Container
{
    constructor(public readonly frame: TransformGizmoFrame)
    {
        super();

        this.visible = false;
    }

    public update()
    {
        // const { frame: { gizmo } } = this;
    }
}
