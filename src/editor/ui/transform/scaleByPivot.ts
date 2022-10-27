import type { Point } from '../../../core/util/geom';
import type { DragInfo } from './operation';
import { ScaleOperation } from './scale';

export class ScaleByPivotOperation extends ScaleOperation
{
    public init(dragInfo: DragInfo): void
    {
        const { gizmo: { vertex } } = this;
        const { isAltDown } = dragInfo;

        super.init(dragInfo);

        if (isAltDown)
        {
            this.setPivotFromVertex(vertex);
        }
    }

    protected calcDelta(dragInfo: DragInfo, delta: Point): boolean
    {
        const { localX, localY } = dragInfo;
        const { pivotX, pivotY, pivotXFrac, pivotYFrac } = this.gizmo;

        const result = super.calcDelta(dragInfo, delta);

        // adjust according to local pos relative to pivot
        if (localX < pivotX)
        {
            delta.x *= 1 / pivotXFrac;
        }
        else
        {
            delta.x *= 1 / (1.0 - pivotXFrac);
        }

        if (localY < pivotY)
        {
            delta.y *= 1 / pivotYFrac;
        }
        else
        {
            delta.y *= 1 / (1.0 - pivotYFrac);
        }

        return result;
    }
}
