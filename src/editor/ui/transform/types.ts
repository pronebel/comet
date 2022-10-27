import type { DisplayObject } from 'pixi.js';

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
