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
    pivotX: 0.3,
    pivotY: 0.3,
    x: 0,
    y: 0,
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
};

export interface TransformGizmoConfig
{
    showTotalBorder: boolean;
    showTransformedBorder: boolean;
    showHandles: boolean;
    showPivot: boolean;
    enableScaleByPivot: boolean;
    enableTranslation: boolean;
    enableRotation: boolean;
    enableScaling: boolean;
    enablePivotTranslation: boolean;
    pivotView: DisplayObject;
    edgeDragDistance: number;
}

export const defaultTransformGizmoConfig: TransformGizmoConfig = {
    showTotalBorder: true,
    showTransformedBorder: true,
    showHandles: true,
    showPivot: true,
    enableScaleByPivot: false,
    enableTranslation: true,
    enableRotation: true,
    enableScaling: true,
    enablePivotTranslation: true,
    pivotView: createDefaultGizmoPivot(),
    edgeDragDistance: 15,
};

export function createDefaultGizmoPivot()
{
    const pivotShape = new Graphics();
    const pivotSize = 10;

    pivotShape.lineStyle(1, 0xffff00, 1);
    pivotShape.beginFill(0xffffff, 0.001);
    pivotShape.drawCircle(0, 0, pivotSize);
    pivotShape.moveTo(0, pivotSize * -1.5);
    pivotShape.lineTo(0, pivotSize * 1.5);
    pivotShape.moveTo(pivotSize * -1.5, 0);
    pivotShape.lineTo(pivotSize * 1.5, 0);
    pivotShape.endFill();

    return pivotShape;
}

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
