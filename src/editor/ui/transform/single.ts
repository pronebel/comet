import type { ContainerNode } from '../../../core/nodes/concrete/container';
import { BaseTransformGizmo } from '.';

export class SingleObjectTransformGizmo extends BaseTransformGizmo
{
    public select(node: ContainerNode)
    {
        const { model, naturalWidth, naturalHeight } = node;
        const {
            pivotX,
            pivotY,
            x,
            y,
            angle,
            scaleX,
            scaleY,
        } = model;

        node.view.updateTransform();

        // const info = getViewGlobalTransform(node.view);

        this.setSize(naturalWidth, naturalHeight);
        this.pivotX = pivotX;
        this.pivotY = pivotY;
        this.x = x;
        this.y = y;
        this.rotation = angle;
        this.scaleX = scaleX;
        this.scaleY = scaleY;
        this.rotation = angle;

        this.update();
    }
}
