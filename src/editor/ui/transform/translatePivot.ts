import { type DragInfo, TransformOperation } from './operation';

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
            this.gizmo.setPivotFromGlobalPoint(dragInfo.globalX, dragInfo.globalY, dragInfo.isControlDown);
        }
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public end(dragInfo: DragInfo): void
    {
        // unused
    }
}
