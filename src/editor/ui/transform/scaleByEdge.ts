import type { Point } from '../../../core/util/geom';
import type { DragInfo } from './operation';
import { ScaleOperation } from './scale';

export class ScaleByEdgeOperation extends ScaleOperation
{
    public init(dragInfo: DragInfo): void
    {
        const { gizmo: { vertex } } = this;
        const { isAltDown } = dragInfo;

        super.init(dragInfo);

        if (isAltDown)
        {
            this.setPivot(0.5, 0.5);
        }
        else
        {
            this.setPivotFromVertex(vertex);
        }
    }

    protected calcDelta(dragInfo: DragInfo, delta: Point): boolean
    {
        const result = super.calcDelta(dragInfo, delta);

        if (this.duplex)
        {
            delta.x *= 2;
            delta.y *= 2;
        }

        return result;
    }
}
