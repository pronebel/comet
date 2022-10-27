import { rotatePointAround } from '../../../core/util/geom';
import { type DragInfo, TransformOperation } from './operation';

export class ScaleByEdgeOperation extends TransformOperation<
'pivotX' | 'pivotY' | 'globalX' | 'globalY' | 'width' | 'height' | 'scaleX' | 'scaleY'
>
{
    public duplex = false;

    protected setPivot(xFrac: number, yFrac: number)
    {
        const { gizmo: { naturalWidth, naturalHeight }, gizmo } = this;
        const localX = naturalWidth * xFrac;
        const localY = naturalHeight * yFrac;

        const globalPoint = gizmo.getGlobalPoint(localX, localY);

        gizmo.setPivotFromGlobalPoint(globalPoint.x, globalPoint.y);
    }

    public init(dragInfo: DragInfo): void
    {
        const { gizmo: { vertex, naturalWidth, naturalHeight }, gizmo } = this;
        const { isAltDown } = dragInfo;

        this.writeCache('pivotX', gizmo.pivotX / naturalWidth);
        this.writeCache('pivotY', gizmo.pivotY / naturalHeight);
        this.writeCache('globalX', dragInfo.globalX);
        this.writeCache('globalY', dragInfo.globalY);
        this.writeCache('width', naturalWidth * gizmo.scaleX);
        this.writeCache('height', naturalHeight * gizmo.scaleY);
        this.writeCache('scaleX', gizmo.scaleX);
        this.writeCache('scaleY', gizmo.scaleY);

        if (isAltDown)
        {
            this.duplex = true;

            this.setPivot(0.5, 0.5);
        }
        else
        {
            this.duplex = false;

            let h = 0.5;
            let v = 0.5;

            if (vertex.h === 'left')
            {
                h = 1;
            }
            else if (vertex.h === 'right')
            {
                h = 0;
            }

            if (vertex.v === 'top')
            {
                v = 1;
            }
            else if (vertex.v === 'bottom')
            {
                v = 0;
            }

            const localX = naturalWidth * h;
            const localY = naturalHeight * v;

            const p = gizmo.getGlobalPoint(localX, localY);

            this.gizmo.setPivotFromGlobalPoint(p.x, p.y);
        }
    }

    public drag(dragInfo: DragInfo): void
    {
        const { gizmo, gizmo: { vertex: v, rotation, pivotGlobalPos }, duplex } = this;
        const { globalX, globalY, isAltDown } = dragInfo;
        const vertex = `${v.h}-${v.v}`;
        const width = this.readCache('width');
        const height = this.readCache('height');
        const dragPointX = this.readCache('globalX');
        const dragPointY = this.readCache('globalY');
        const p1 = rotatePointAround(globalX, globalY, -rotation, pivotGlobalPos.x, pivotGlobalPos.y);
        const p2 = rotatePointAround(dragPointX, dragPointY, -rotation, pivotGlobalPos.x, pivotGlobalPos.y);
        let deltaX = (p1.x - p2.x);
        let deltaY = (p1.y - p2.y);
        let scaleX = this.readCache('scaleX');
        let scaleY = this.readCache('scaleY');

        if (isAltDown)
        {
            if (!duplex)
            {
                // reset drag scaling state
                this.end(dragInfo);
                this.gizmo.updateTransform();
                this.init(dragInfo);

                // enable duplex
                this.duplex = true;

                this.setPivot(0.5, 0.5);

                return;
            }
        }
        else
        if (duplex)
        {
            // disable duplex
            this.duplex = false;

            // reset drag scaling state
            this.end(dragInfo);
            this.gizmo.updateTransform();
            this.init(dragInfo);

            return;
        }

        if (this.duplex)
        {
            deltaX *= 2;
            deltaY *= 2;
        }

        if (
            vertex === 'left-top'
                || vertex === 'left-center'
                || vertex === 'left-bottom'
        )
        {
            deltaX *= -1;
        }

        if (
            vertex === 'left-top'
                || vertex === 'center-top'
                || vertex === 'right-top'
        )
        {
            deltaY *= -1;
        }

        if (
            vertex === 'left-top'
                || vertex === 'left-center'
                || vertex === 'left-bottom'
                || vertex === 'right-top'
                || vertex === 'right-center'
                || vertex === 'right-bottom'
        )
        {
            scaleX = ((width + deltaX) / width) * this.readCache('scaleX');
        }

        if (
            vertex === 'left-top'
                || vertex === 'center-top'
                || vertex === 'right-top'
                || vertex === 'left-bottom'
                || vertex === 'center-bottom'
                || vertex === 'right-bottom'
        )
        {
            scaleY = ((height + deltaY) / height) * this.readCache('scaleY');
        }

        gizmo.scaleX = scaleX;
        gizmo.scaleY = scaleY;
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public end(dragInfo: DragInfo): void
    {
        const origPivotX = this.readCache('pivotX');
        const origPivotY = this.readCache('pivotY');

        this.setPivot(origPivotX, origPivotY);
    }
}
