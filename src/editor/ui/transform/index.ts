import { type Container, type InteractionEvent, Transform } from 'pixi.js';

import { type Point, degToRad, radToDeg } from '../../../core/util/geom';
import { TransformGizmoFrame } from './frame';
import type { HandleVertex } from './handle';
import { type DragInfo, type TransformOperation, defaultDragInfo } from './operation';
import { RotateOperation } from './rotate';
import { TranslateOperation } from './translate';
import { TranslatePivotOperation } from './translatePivot';
import { type TransformGizmoConfig, defaultTransformGizmoConfig } from './types';

export class BaseTransformGizmo
{
    public config: TransformGizmoConfig;

    public naturalWidth: number;
    public naturalHeight: number;
    public visualPivot?: Point;

    public transform: Transform;
    public frame: TransformGizmoFrame;

    public vertex: HandleVertex;
    public operation?: TransformOperation;
    public dragInfo?: DragInfo;

    constructor(config?: TransformGizmoConfig)
    {
        this.config = config ?? { ...defaultTransformGizmoConfig };

        this.naturalWidth = 1;
        this.naturalHeight = 1;

        this.transform = new Transform();
        this.frame = new TransformGizmoFrame(this);
        this.vertex = { h: 'none', v: 'none' };

        this.initFrame();
    }

    protected initFrame()
    {
        const { frame } = this;

        frame
            .on('mousedown', (e: InteractionEvent) =>
            {
                this.setActiveVertex({ h: 'none', v: 'none' });
                this.onMouseDown(e);
            })
            .on('mousemove', this.onMouseMove)
            .on('mouseup', this.onMouseUp);
    }

    public setContainer(container: Container)
    {
        container.addChild(this.frame.container);
    }

    public setSize(width: number, height: number)
    {
        this.naturalWidth = width;
        this.naturalHeight = height;
    }

    public setVisualPivot(xFrac: number, yFrac: number)
    {
        this.visualPivot = {
            x: xFrac,
            y: yFrac,
        };
    }

    public setConfig(config: Partial<TransformGizmoConfig>)
    {
        this.config = {
            ...this.config,
            ...config,
        };

        if (config.pivotView)
        {
            this.frame.setPivotView(config.pivotView);
        }
    }

    public setActiveVertex(vertex: HandleVertex)
    {
        this.vertex = vertex;
    }

    public getLocalPoint(globalX: number, globalY: number)
    {
        return this.matrix.applyInverse({ x: globalX, y: globalY });
    }

    protected getGlobalPoint(localX: number, localY: number)
    {
        return this.matrix.apply({ x: localX, y: localY });
    }

    public constrainLocalPoint(localPoint: {x: number; y: number})
    {
        const { naturalWidth, naturalHeight } = this;

        localPoint.x = Math.min(naturalWidth, Math.max(0, localPoint.x));
        localPoint.y = Math.min(naturalHeight, Math.max(0, localPoint.y));
    }

    public setPivotFromGlobalPoint(globalX: number, globalY: number, constrain = false)
    {
        this.transform.updateLocalTransform();

        const globalPoint = { x: globalX, y: globalY };
        const localPoint = this.getLocalPoint(globalX, globalY);

        if (constrain)
        {
            this.constrainLocalPoint(localPoint);
            const p = this.getGlobalPoint(localPoint.x, localPoint.y);

            globalPoint.x = p.x;
            globalPoint.y = p.y;
        }

        this.transform.pivot.x = localPoint.x;
        this.transform.pivot.y = localPoint.y;

        this.transform.updateLocalTransform();

        const p = this.getGlobalPoint(localPoint.x, localPoint.y);

        const deltaX = p.x - globalPoint.x;
        const deltaY = p.y - globalPoint.y;

        this.x -= deltaX;
        this.y -= deltaY;
    }

    protected updateDragInfoFromEvent(e: InteractionEvent)
    {
        const { dragInfo } = this;

        if (dragInfo)
        {
            const globalX = e.data.global.x;
            const globalY = e.data.global.y;
            const { x: localX, y: localY } = this.getLocalPoint(globalX, globalY);

            dragInfo.globalX = globalX;
            dragInfo.globalY = globalY;
            dragInfo.localX = localX;
            dragInfo.localY = localY;
            dragInfo.isShiftDown = e.data.originalEvent.shiftKey;
            dragInfo.isAltDown = e.data.originalEvent.altKey;
            dragInfo.isMetaDown = e.data.originalEvent.metaKey;
            dragInfo.isControlDown = e.data.originalEvent.ctrlKey;
            dragInfo.buttons = e.data.buttons;
        }
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public onMouseDown = (e: InteractionEvent) =>
    {
        this.dragInfo = {
            ...defaultDragInfo,
        };

        this.updateDragInfoFromEvent(e);

        const { dragInfo: { isMetaDown, isShiftDown }, isVertexDrag } = this;

        // select operation
        if (isMetaDown)
        {
            this.operation = new RotateOperation(this);
        }
        else if (isVertexDrag)
        {
            // todo: scale
        }
        else
        if (isShiftDown)
        {
            this.operation = new TranslatePivotOperation(this);
        }
        else
        {
            this.operation = new TranslateOperation(this);
        }

        // init and start operation
        if (this.operation)
        {
            this.operation.init(this.dragInfo);
            this.operation.drag(this.dragInfo);
        }

        this.update();
    };

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public onMouseMove = (e: InteractionEvent) =>
    {
        if (this.operation && this.dragInfo)
        {
            this.updateDragInfoFromEvent(e);
            this.operation.drag(this.dragInfo);

            this.update();
        }
    };

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public onMouseUp = (e: MouseEvent) =>
    {
        if (this.operation && this.dragInfo)
        {
            console.log('mouseup');
            this.operation.end(this.dragInfo);
        }

        // reset
        this.vertex = { h: 'none', v: 'none' };
        delete this.operation;
        delete this.dragInfo;
    };

    get isVertexDrag()
    {
        if (this.vertex)
        {
            return this.vertex.h !== 'none' && this.vertex.v !== 'none';
        }

        return false;
    }

    get matrix()
    {
        return this.transform.localTransform;
    }

    get x()
    {
        return this.transform.position.x;
    }

    set x(x: number)
    {
        this.transform.position.x = x;
    }

    get y()
    {
        return this.transform.position.y;
    }

    set y(y: number)
    {
        this.transform.position.y = y;
    }

    get pivotX()
    {
        return this.transform.pivot.x;
    }

    set pivotX(xFraction: number)
    {
        this.transform.pivot.x = this.naturalWidth * xFraction;
    }

    get pivotY()
    {
        return this.transform.pivot.y;
    }

    set pivotY(yFraction: number)
    {
        this.transform.pivot.y = this.naturalHeight * yFraction;
    }

    get visualPivotGlobalPos()
    {
        const { matrix, visualPivot, naturalWidth, naturalHeight } = this;

        if (visualPivot)
        {
            return matrix.apply({ x: naturalWidth * visualPivot.x, y: naturalHeight * visualPivot.y });
        }

        return this.transformPivotGlobalPos;
    }

    get transformPivotGlobalPos()
    {
        const { matrix, transform } = this;

        return matrix.apply({ x: transform.pivot.x, y: transform.pivot.y });
    }

    get pivotGlobalPos()
    {
        return this.visualPivot ? this.visualPivotGlobalPos : this.transformPivotGlobalPos;
    }

    get rotation()
    {
        return radToDeg(this.transform.rotation);
    }

    set rotation(deg: number)
    {
        this.transform.rotation = degToRad(deg);
    }

    get scaleX()
    {
        return this.transform.scale.x;
    }

    set scaleX(x: number)
    {
        this.transform.scale.x = x;
    }

    get scaleY()
    {
        return this.transform.scale.y;
    }

    set scaleY(y: number)
    {
        this.transform.scale.y = y;
    }

    public update()
    {
        this.transform.updateLocalTransform();

        this.frame.update();
    }
}
