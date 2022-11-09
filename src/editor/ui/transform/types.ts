import { type DisplayObject, Container } from 'pixi.js';

import { yellowPivot } from './util';

export interface TransformGizmoConfig
{
    rootContainer: Container;
    showEncompassingBorder: boolean;
    showTransformBorder: boolean;
    showPrimaryHandles: boolean;
    showSecondaryHandles: boolean;
    showPivot: boolean;
    enablePivotTranslation: boolean;
    enableTranslation: boolean;
    enableRotation: boolean;
    enableScaling: boolean;
    defaultScaleMode: 'edge' | 'pivot';
    pivotView: DisplayObject;
    handlePrimarySize: number;
    handleSecondarySize: number;
}

export const defaultTransformGizmoConfig: TransformGizmoConfig = {
    rootContainer: new Container(),
    showEncompassingBorder: true,
    showTransformBorder: true,
    showPrimaryHandles: true,
    showSecondaryHandles: true,
    showPivot: true,
    enablePivotTranslation: true,
    enableTranslation: true,
    enableRotation: true,
    enableScaling: true,
    defaultScaleMode: 'edge',
    pivotView: yellowPivot,
    handlePrimarySize: 5,
    handleSecondarySize: 4,
};
