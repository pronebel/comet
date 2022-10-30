import { Graphics } from 'pixi.js';

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
