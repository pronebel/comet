import type { ContainerNode } from '../../../core/nodes/concrete/container';
import { BaseTransformGizmo } from '.';
import { getViewGlobalTransform } from './util';

export class SingleObjectTransformGizmo extends BaseTransformGizmo
{
    public select(node: ContainerNode)
    {
        const { model } = node;
        const {
            pivotX,
            pivotY,
            x,
            y,
            angle,
            scaleX,
            scaleY,
        } = model;

        this.pivotX = pivotX;
        this.pivotY = pivotY;
        this.x = x;
        this.y = y;
        this.rotation = angle;
        this.scaleX = scaleX;
        this.scaleY = scaleY;

        node.view.updateTransform();

        const info = getViewGlobalTransform(node.view);

        console.log(info);

        this.setSize(info.width, info.height);
        this.rotation = info.rotation;

        this.update();
    }
}
