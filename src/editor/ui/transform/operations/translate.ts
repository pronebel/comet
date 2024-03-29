import { type DragInfo, TransformOperation } from '../operation';
import { snapToIncrement } from '../util';

export class TranslateOperation extends TransformOperation<'x' | 'y' | 'globalX' | 'globalY'>
{
    public init(dragInfo: DragInfo): void
    {
        this.writeCache('x', this.gizmo.x);
        this.writeCache('y', this.gizmo.y);
        this.writeCache('globalX', dragInfo.globalX);
        this.writeCache('globalY', dragInfo.globalY);
    }

    public drag(dragInfo: DragInfo): void
    {
        const deltaX = dragInfo.globalX - this.readCache('globalX');
        const deltaY = dragInfo.globalY - this.readCache('globalY');

        let x = this.readCache('x') + deltaX;
        let y = this.readCache('y') + deltaY;

        if (dragInfo.isShiftDown)
        {
            x = snapToIncrement(x, 10);
            y = snapToIncrement(y, 10);
        }

        this.gizmo.x = x;
        this.gizmo.y = y;
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public end(dragInfo: DragInfo): void
    {
        // unused
    }
}
