import type { Container } from 'pixi.js';
import { Graphics } from 'pixi.js';

import { angleBetween, distanceBetween } from '../../../core/util/geom';

export function round(num: number)
{
    return Math.round((num + Number.EPSILON) * 1000) / 1000;
}

export interface PivotConfig
{
    radius: number;
    lineColor: number;
    bgColor: number;
    bgAlpha: number;
    crosshairSize: number;
}

export function createPivotShape(config: PivotConfig)
{
    const { radius, lineColor, bgColor, bgAlpha, crosshairSize } = config;
    const pivotShape = new Graphics();

    pivotShape.lineStyle(1, lineColor, 1);
    pivotShape.beginFill(bgColor, bgAlpha);
    pivotShape.drawCircle(0, 0, radius);
    if (crosshairSize > 0)
    {
        pivotShape.moveTo(0, crosshairSize * -1); pivotShape.lineTo(0, crosshairSize);
        pivotShape.moveTo(crosshairSize * -1, 0); pivotShape.lineTo(crosshairSize, 0);
    }
    pivotShape.endFill();

    return pivotShape;
}

export const yellowPivot = createPivotShape({
    radius: 7,
    lineColor: 0xffff00,
    bgColor: 0xffffff,
    bgAlpha: 0.1,
    crosshairSize: 12,
});

export const bluePivot = createPivotShape({
    radius: 5,
    lineColor: 0xffffff,
    bgColor: 0x0000ff,
    bgAlpha: 1,
    crosshairSize: 10,
});

export function getViewGlobalTransform(view: Container)
{
    const matrix = view.worldTransform;
    const { width, height } = view.getLocalBounds();

    const p0 = matrix.apply({ x: view.pivot.x, y: view.pivot.y });
    const p1 = matrix.apply({ x: 0, y: 0 });
    const p2 = matrix.apply({ x: width, y: 0 });
    const p3 = matrix.apply({ x: width, y: height });
    const p4 = matrix.apply({ x: 0, y: height });

    const w = distanceBetween(p1.x, p1.y, p2.x, p2.y);
    const h = distanceBetween(p1.x, p1.y, p4.x, p4.y);
    const rotation = angleBetween(p1.x, p1.y, p2.x, p2.y);

    return {
        quad: [p1, p2, p3, p4],
        x: p0.x,
        y: p0.y,
        width: w,
        height: h,
        rotation,
    };
}
