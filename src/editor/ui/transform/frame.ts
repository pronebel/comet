import { EventEmitter } from 'eventemitter3';
import type { DisplayObject, InteractionEvent } from 'pixi.js';
import { Container, Graphics } from 'pixi.js';

import type { BaseTransformGizmo } from '.';
import { type HandleVertexHorizontal, type HandleVertexVertical, TransformGizmoHandle } from './handle';
import { yellowPivot } from './util';

const primaryHandleSize = 10;
const secondaryHandleSize = 7;

export type TransformGizmoFrameEvent = 'mousedown' | 'mousemove' | 'mouseup';

export class TransformGizmoFrame extends EventEmitter<TransformGizmoFrameEvent>
{
    public container: Container;
    public handles: Container;
    public border: Graphics;
    public pivotView: DisplayObject;

    public topLeftHandle: TransformGizmoHandle;
    public topRightHandle: TransformGizmoHandle;
    public bottomRightHandle: TransformGizmoHandle;
    public bottomLeftHandle: TransformGizmoHandle;

    public topCenterHandle: TransformGizmoHandle;
    public rightCenterHandle: TransformGizmoHandle;
    public bottomCenterHandle: TransformGizmoHandle;
    public leftCenterHandle: TransformGizmoHandle;

    constructor(public readonly gizmo: BaseTransformGizmo)
    {
        super();

        this.container = new Container();
        this.handles = new Container();
        this.border = new Graphics();

        this.pivotView = yellowPivot;

        this.container.addChild(this.border);
        this.container.addChild(this.pivotView);
        this.container.addChild(this.handles);

        this.topLeftHandle = this.createHandle(primaryHandleSize, 'left', 'top');
        this.topRightHandle = this.createHandle(primaryHandleSize, 'right', 'top');
        this.bottomRightHandle = this.createHandle(primaryHandleSize, 'right', 'bottom');
        this.bottomLeftHandle = this.createHandle(primaryHandleSize, 'left', 'bottom');

        this.topCenterHandle = this.createHandle(secondaryHandleSize, 'center', 'top');
        this.rightCenterHandle = this.createHandle(secondaryHandleSize, 'right', 'center');
        this.bottomCenterHandle = this.createHandle(secondaryHandleSize, 'center', 'bottom');
        this.leftCenterHandle = this.createHandle(secondaryHandleSize, 'left', 'center');

        this.initEvents();
    }

    protected createHandle(size: number, h: HandleVertexHorizontal, v: HandleVertexVertical)
    {
        const vertex = { h, v };
        const handle = new TransformGizmoHandle(size, vertex);

        this.handles.addChild(handle);

        handle
            .on('mousedown', (e: InteractionEvent) =>
            {
                this.gizmo.setActiveVertex(vertex);
                this.gizmo.onMouseDown(e);
            })
            .on('mousemove', this.gizmo.onMouseMove);

        return handle;
    }

    protected initEvents()
    {
        const { border } = this;

        border.interactive = true;
        border
            .on('mousedown', this.gizmo.onMouseDown)
            .on('mousemove', this.gizmo.onMouseMove);

        window.addEventListener('mouseup', this.gizmo.onMouseUp);
    }

    protected drawBorder()
    {
        const { border, gizmo } = this;
        const { matrix, naturalWidth: width, naturalHeight: height } = gizmo;

        border.clear();

        const p1 = matrix.apply({ x: 0, y: 0 });
        const p2 = matrix.apply({ x: width, y: 0 });
        const p3 = matrix.apply({ x: width, y: height });
        const p4 = matrix.apply({ x: 0, y: height });

        const path = [p1.x, p1.y, p2.x, p2.y, p3.x, p3.y, p4.x, p4.y];

        border.beginFill(0xffffff, 0.1);
        border.drawPolygon(path);
        border.endFill();

        border.lineStyle(1, 0xffffff, 1);
        border.moveTo(p1.x, p1.y); border.lineTo(p2.x, p2.y);
        border.moveTo(p2.x, p2.y); border.lineTo(p3.x, p3.y);
        border.moveTo(p3.x, p3.y); border.lineTo(p4.x, p4.y);
        border.moveTo(p4.x, p4.y); border.lineTo(p1.x, p1.y);
    }

    protected drawPivot()
    {
        const { gizmo, pivotView: pivotShape } = this;
        const { pivotGlobalPos, rotation } = gizmo;

        pivotShape.x = pivotGlobalPos.x;
        pivotShape.y = pivotGlobalPos.y;
        pivotShape.angle = rotation;
    }

    protected drawHandles()
    {
        const { gizmo,
            topLeftHandle, topRightHandle, bottomRightHandle, bottomLeftHandle,
            topCenterHandle, rightCenterHandle, bottomCenterHandle, leftCenterHandle,
        } = this;
        const { matrix, naturalWidth: width, naturalHeight: height } = gizmo;

        const p1 = matrix.apply({ x: 0, y: 0 });
        const p2 = matrix.apply({ x: width, y: 0 });
        const p3 = matrix.apply({ x: width, y: height });
        const p4 = matrix.apply({ x: 0, y: height });

        this.drawHandle(topLeftHandle, p1.x, p1.y);
        this.drawHandle(topRightHandle, p2.x, p2.y);
        this.drawHandle(bottomRightHandle, p3.x, p3.y);
        this.drawHandle(bottomLeftHandle, p4.x, p4.y);

        const centerX = width * 0.5;
        const centerY = height * 0.5;
        const p5 = matrix.apply({ x: centerX, y: 0 });
        const p6 = matrix.apply({ x: width, y: centerY });
        const p7 = matrix.apply({ x: centerX, y: height });
        const p8 = matrix.apply({ x: 0, y: centerY });

        this.drawHandle(topCenterHandle, p5.x, p5.y);
        this.drawHandle(rightCenterHandle, p6.x, p6.y);
        this.drawHandle(bottomCenterHandle, p7.x, p7.y);
        this.drawHandle(leftCenterHandle, p8.x, p8.y);
    }

    protected drawHandle(handle: TransformGizmoHandle, x: number, y: number)
    {
        const { rotation } = this.gizmo;

        handle.x = x;
        handle.y = y;
        handle.angle = rotation;
    }

    public update()
    {
        this.drawBorder();
        this.drawPivot();
        this.drawHandles();
    }

    public setPivotView(pivotView: DisplayObject)
    {
        this.container.removeChild(this.pivotView);
        this.container.addChild(pivotView);
        this.pivotView = pivotView;
        this.drawPivot();
    }
}