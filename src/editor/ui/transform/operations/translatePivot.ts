import { type DragInfo, TransformOperation } from '../operation';
import { snapToIncrement } from '../util';

export class TranslatePivotOperation extends TransformOperation
{
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public init(dragInfo: DragInfo): void
    {
        // unused
    }

    public drag(dragInfo: DragInfo): void
    {
        if (dragInfo.isAltDown)
        {
            const localPoint = { x: dragInfo.localX, y: dragInfo.localY };

            if (dragInfo.isControlDown)
            {
                this.gizmo.constrainLocalPoint(localPoint);
            }

            if (dragInfo.isShiftDown)
            {
                localPoint.x = snapToIncrement(localPoint.x, 1);
                localPoint.y = snapToIncrement(localPoint.y, 1);
            }

            this.gizmo.setPivot(localPoint.x, localPoint.y);
        }
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public end(dragInfo: DragInfo): void
    {
        // unused
    }
}
