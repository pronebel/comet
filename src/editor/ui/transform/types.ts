import type { DisplayObject } from 'pixi.js';

import type { DragHVertex, DragVVertex } from '../../../core/util/geom';
import { yellowPivot } from './util';

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
    enableScaleByPivot: true,
    pivotView: yellowPivot,
    edgeDragDistance: 5,
    handlePrimarySize: 5,
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
