import type { ContainerNode } from '../../../core/nodes/concrete/container';
import { BaseTransformGizmo } from '.';

export class SingleObjectTransformGizmo extends BaseTransformGizmo
{
    public node?: ContainerNode;

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

        this.node = node;

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

    public update(): void
    {
        super.update();

        if (this.node)
        {
            const { x, y, rotation, pivotX: px, pivotY: py, scaleX, scaleY, naturalWidth, naturalHeight } = this;
            const pivotX = px;
            const pivotY = py;

            console.log(pivotX, pivotY);

            this.node.model.setValues({
                x,
                y,
                scaleX,
                scaleY,
                angle: rotation,
                pivotX: pivotX / naturalWidth,
                pivotY: pivotY / naturalHeight,
            });
        }
    }
}
