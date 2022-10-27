import { type DragInfo, TransformOperation } from './operation';

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

        this.gizmo.x = this.readCache('x') + deltaX;
        this.gizmo.y = this.readCache('y') + deltaY;
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public end(dragInfo: DragInfo): void
    {
        // unused
    }
}
