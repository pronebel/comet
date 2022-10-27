import { type DragInfo, TransformOperation } from './operation';

export class TranslatePivotOperation extends TransformOperation<'pivotX' | 'pivotY'>
{
    public init(dragInfo: DragInfo): void
    {
        this.writeCache('pivotX', this.gizmo.pivotX);
        this.writeCache('pivotY', this.gizmo.pivotY);
    }

    public drag(dragInfo: DragInfo): void
    {
        this.gizmo.setPivotFromGlobalPoint(dragInfo.globalX, dragInfo.globalY, dragInfo.isAltDown);
    }

    public end(dragInfo: DragInfo): void
    {
        //
    }
}
