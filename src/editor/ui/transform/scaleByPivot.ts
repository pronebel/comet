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
        const { gizmo: { pivotX, pivotY, initialTransform: { width, height } } } = this;

        const pivotXFrac = pivotX / width;
        const pivotYFrac = pivotY / height;

        const result = super.calcDelta(dragInfo, delta);

        // adjust according to local pos relative to pivot
        const h = 1 / pivotXFrac;

        if (localX < pivotX && !isNaN(h) && (h !== Infinity))
        {
            delta.x *= h;
        }
        else
        {
            delta.x *= 1 / (1.0 - pivotXFrac);
        }

        const v = 1 / pivotYFrac;

        if (localY < pivotY && !isNaN(v) && (v !== Infinity))
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
