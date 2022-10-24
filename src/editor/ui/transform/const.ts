import { type DisplayObject, Graphics } from 'pixi.js';

import type { DragHVertex, DragVVertex } from '../../../core/util/geom';

export interface TransformState
{
    pivotX: number;
    pivotY: number;
    x: number;
    y: number;
    scaleX: number;
    scaleY: number;
    rotation: number;
}

export const defaultTransformState: TransformState = {
    pivotX: 0.5,
    pivotY: 0.5,
    x: 0,
    y: 0,
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
};

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

export interface TransformGizmoConfig
{
    showEncompassingBorder: boolean;
    showPrimaryHandles: boolean;
    showSecondaryHandles: boolean;
    showPivot: boolean;
    enablePivotTranslation: boolean;
    enableTranslation: boolean;
    enableRotation: boolean;
    enableScaling: boolean;
    enableScaleByPivot: boolean;
    pivotView: DisplayObject;
    edgeDragDistance: number;
    handlePrimarySize: number;
    handleSecondarySize: number;
}

export const defaultTransformGizmoConfig: TransformGizmoConfig = {
    showEncompassingBorder: true,
    showPrimaryHandles: true,
    showSecondaryHandles: true,
    showPivot: true,
    enablePivotTranslation: true,
    enableTranslation: true,
    enableRotation: true,
    enableScaling: true,
    enableScaleByPivot: false,
    pivotView: yellowPivot,
    edgeDragDistance: 5,
    handlePrimarySize: 7,
    handleSecondarySize: 4,
};

export interface TransformDragInfo
{
    hVertex: DragHVertex;
    vVertex: DragVVertex;
    duplex: boolean;
    vertex: string;
    width: number;
    height: number;
    angle: number;
    globalX: number;
    globalY: number;
}

export const defaultTransformDragInfo: TransformDragInfo = {
    hVertex: 'center',
    vVertex: 'center',
    duplex: false,
    vertex: '',
    width: 0,
    height: 0,
    angle: 0,
    globalX: 0,
    globalY: 0,
};
