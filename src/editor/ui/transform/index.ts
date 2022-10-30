import { EventEmitter } from 'eventemitter3';
import type { Matrix } from 'pixi.js';
import { type Container, type InteractionEvent, Rectangle, Transform } from 'pixi.js';

import type { ContainerNode } from '../../../core/nodes/concrete/container';
import { type Point, degToRad, radToDeg } from '../../../core/util/geom';
import { TransformGizmoFrame } from './frame';
import type { HandleVertex } from './handle';
import { type DragInfo, type TransformOperation, defaultDragInfo } from './operation';
import { RotateOperation } from './rotate';
import { ScaleByEdgeOperation } from './scaleByEdge';
import { ScaleByPivotOperation } from './scaleByPivot';
import { TranslateOperation } from './translate';
import { TranslatePivotOperation } from './translatePivot';
import { type TransformGizmoConfig, defaultTransformGizmoConfig } from './types';
import type { InitialGizmoTransform } from './util';
import { defaultInitialGizmoTransform, getGizmoInitialTransformFromView, updateTransforms } from './util';

export type TransformGizmoEvent = 'changed';

export class TransformGizmo extends EventEmitter<TransformGizmoEvent>
{
    public config: TransformGizmoConfig;

    public visualPivot?: Point;

    public initialTransform: InitialGizmoTransform;
    public transform: Transform;
    public frame: TransformGizmoFrame;
    public selected: ContainerNode[];
    public matrixCache: Map<ContainerNode, Matrix>;

    public vertex: HandleVertex;
    public operation?: TransformOperation;
    public dragInfo?: DragInfo;

    constructor(config?: TransformGizmoConfig)
    {
        super();

        this.config = config ?? { ...defaultTransformGizmoConfig };

        this.initialTransform = defaultInitialGizmoTransform;
        this.transform = new Transform();
        this.frame = new TransformGizmoFrame(this);
        this.vertex = { h: 'none', v: 'none' };
        this.selected = [];
        this.matrixCache = new Map();

        this.hide();

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

    public show()
    {
        const { frame: { container } } = this;

        if (!container.visible)
        {
            container.visible = true;
        }
    }

    public hide()
    {
        const { frame: { container } } = this;

        if (container.visible)
        {
            container.visible = false;
        }
    }

    public get isVisible()
    {
        return this.frame.container.visible;
    }

    public setContainer(container: Container)
    {
        container.addChild(this.frame.container);
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

    public getGlobalPoint(localX: number, localY: number)
    {
        return this.matrix.apply({ x: localX, y: localY });
    }

    public constrainLocalPoint(localPoint: {x: number; y: number})
    {
        const { initialTransform: { width, height } } = this;

        localPoint.x = Math.min(width, Math.max(0, localPoint.x));
        localPoint.y = Math.min(height, Math.max(0, localPoint.y));
    }

    public setPivotFromGlobalPoint(globalX: number, globalY: number, constrain = false)
    {
        this.updateTransform();

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

        this.updateTransform();

        const p = this.getGlobalPoint(localPoint.x, localPoint.y);

        const deltaX = p.x - globalPoint.x;
        const deltaY = p.y - globalPoint.y;

        this.x -= deltaX;
        this.y -= deltaY;
    }

    protected updateDragInfoFromEvent(event: InteractionEvent)
    {
        const { dragInfo } = this;

        if (dragInfo)
        {
            const globalX = event.data.global.x;
            const globalY = event.data.global.y;
            const { x: localX, y: localY } = this.getLocalPoint(globalX, globalY);

            dragInfo.globalX = globalX;
            dragInfo.globalY = globalY;
            dragInfo.localX = localX;
            dragInfo.localY = localY;
            dragInfo.isShiftDown = event.data.originalEvent.shiftKey;
            dragInfo.isAltDown = event.data.originalEvent.altKey;
            dragInfo.isMetaDown = event.data.originalEvent.metaKey;
            dragInfo.isControlDown = event.data.originalEvent.ctrlKey;
            dragInfo.buttons = event.data.buttons;
            dragInfo.event = event;
        }
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public onMouseDown = (event: InteractionEvent) =>
    {
        this.dragInfo = {
            ...defaultDragInfo,
            event,
        };

        this.updateDragInfoFromEvent(event);

        const {
            dragInfo: { isMetaDown, isShiftDown },
            isVertexDrag,
            config,
        } = this;

        // select operation
        if (isMetaDown)
        {
            this.operation = new RotateOperation(this);
        }
        else if (isVertexDrag)
        {
            if (config.enableScaleByPivot)
            {
                this.operation = new ScaleByPivotOperation(this);
            }
            else
            {
                this.operation = new ScaleByEdgeOperation(this);
            }
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

        event.stopPropagation();
    };

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public onMouseMove = (event: InteractionEvent) =>
    {
        if (this.operation && this.dragInfo)
        {
            this.updateDragInfoFromEvent(event);
            this.operation.drag(this.dragInfo);

            this.update();
        }
    };

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public onMouseUp = (event: MouseEvent) =>
    {
        if (this.operation && this.dragInfo)
        {
            this.operation.end(this.dragInfo);

            this.update();
        }

        // reset
        this.clearOperation();

        // this.emit('changed', values);
    };

    public clearOperation()
    {
        this.vertex = { h: 'none', v: 'none' };
        delete this.operation;
        delete this.dragInfo;
    }

    get isVertexDrag()
    {
        if (this.vertex)
        {
            return this.vertex.h !== 'none' && this.vertex.v !== 'none';
        }

        return false;
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

    set pivotX(x: number)
    {
        this.transform.pivot.x = x;
    }

    get pivotY()
    {
        return this.transform.pivot.y;
    }

    set pivotY(y: number)
    {
        this.transform.pivot.y = y;
    }

    get visualPivotGlobalPos()
    {
        const { matrix, visualPivot } = this;

        if (visualPivot)
        {
            return matrix.apply({ x: visualPivot.x, y: visualPivot.y });
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

    public getGlobalBounds()
    {
        return new Rectangle();
    }

    public updateTransform()
    {
        this.transform.updateLocalTransform();
    }

    public update()
    {
        this.updateTransform();
        this.updateSelected();
        this.frame.update();
    }

    protected updateSelected()
    {
        this.selected.forEach((node) =>
        {
            const view = node.getView();
            const cachedMatrix = (this.matrixCache.get(node) as Matrix).clone();

            const thisMatrix = this.matrix;

            thisMatrix.prepend(this.initialTransform.matrix.clone().invert());
            cachedMatrix.append(thisMatrix);

            view.transform.setFromMatrix(cachedMatrix);
        });
    }

    get matrix()
    {
        return this.transform.localTransform.clone();
    }

    public select<T extends ContainerNode>(node: T)
    {
        const transform = getGizmoInitialTransformFromView(node);

        this.initialTransform = transform;

        this.transform = new Transform();
        this.transform.pivot.x = transform.pivotX;
        this.transform.pivot.y = transform.pivotY;
        this.transform.position.x = transform.x;
        this.transform.position.y = transform.y;
        this.transform.rotation = degToRad(transform.rotation);
        this.transform.scale.x = transform.scaleX;
        this.transform.scale.y = transform.scaleY;

        this.selected = [node];

        const view = node.view;

        updateTransforms(view);

        const cachedMatrix = view.worldTransform.clone();

        if (view.parent)
        {
            const parentMatrix = view.parent.worldTransform.clone();

            parentMatrix.invert();
            cachedMatrix.prepend(parentMatrix);
        }

        this.matrixCache.set(node, cachedMatrix);

        this.update();
        this.show();
    }

    public deselect()
    {
        this.selected.length = 0;
        this.matrixCache.clear();
        this.hide();
    }
}
