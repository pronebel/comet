import { angleBetween } from '../../../core/util/geom';
import { type DragInfo, TransformOperation } from './operation';
import { snapToIncrement } from './util';

export class RotateOperation extends TransformOperation<'rotation' | 'dragAngle'>
{
    public init(dragInfo: DragInfo): void
    {
        const p = this.gizmo.pivotGlobalPos;
        const dragAngle = angleBetween(p.x, p.y, dragInfo.globalX, dragInfo.globalY);

        this.writeCache('rotation', this.gizmo.rotation);
        this.writeCache('dragAngle', dragAngle);
    }

    public drag(dragInfo: DragInfo): void
    {
        const p = this.gizmo.pivotGlobalPos;
        const dragAngle = angleBetween(p.x, p.y, dragInfo.globalX, dragInfo.globalY);
        const delta = dragAngle - this.readCache('dragAngle');

        let rotation = this.readCache('rotation') + delta;

        if (dragInfo.isShiftDown)
        {
            rotation = snapToIncrement(rotation, 15);
        }

        this.gizmo.rotation = rotation;
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public end(dragInfo: DragInfo): void
    {
        // unused
    }
}
