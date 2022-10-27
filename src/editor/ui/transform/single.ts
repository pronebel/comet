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

        this.show();
    }

    public deselect(): void
    {
        delete this.node;
        this.hide();
    }

    public update(): void
    {
        super.update();

        if (this.node)
        {
            this.node.model.setValues(this.values);
        }
    }
}
