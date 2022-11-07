import type { Container, InteractionEvent } from 'pixi.js';
import { Matrix, Rectangle, Transform } from 'pixi.js';

import type { DisplayObjectModel } from '../../../core/nodes/abstract/displayObject';
import type { ContainerNode } from '../../../core/nodes/concrete/container';
import { type Point, degToRad, radToDeg } from '../../../core/util/geom';
import { Application } from '../../application';
import { ModifyModelCommand } from '../../commands/modifyModel';
import { TransformGizmoFrame } from './frame';
import type { HandleVertex } from './handle';
import { type DragInfo, type TransformOperation, defaultDragInfo } from './operation';
import { RotateOperation } from './operations/rotate';
import { ScaleByEdgeOperation } from './operations/scaleByEdge';
import { ScaleByPivotOperation } from './operations/scaleByPivot';
import { TranslateOperation } from './operations/translate';
import { TranslatePivotOperation } from './operations/translatePivot';
import type { TransformGizmoConfig } from './types';
import { defaultTransformGizmoConfig } from './types';
import type { InitialGizmoTransform } from './util';
import {
    bluePivot,     decomposeTransform,
    defaultInitialGizmoTransform,
    getGizmoInitialTransformFromView,
    getTotalGlobalBounds,
    updateTransforms,
    yellowPivot,
} from './util';

export class TransformGizmo
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

    get isVertexDrag()
    {
        if (this.vertex)
        {
            return this.vertex.h !== 'none' && this.vertex.v !== 'none';
        }

        return false;
    }

    get localX()
    {
        if (this.selected.length === 1)
        {
            return this.selected[0].view.x;
        }

        return this.x;
    }

    get localY()
    {
        if (this.selected.length === 1)
        {
            return this.selected[0].view.y;
        }

        return this.y;
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

    get matrix()
    {
        return this.transform.localTransform.clone();
    }

    public get isVisible()
    {
        return this.frame.container.visible;
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

    public setContainer(container: Container)
    {
        container.addChild(this.frame.container);
    }

    public setVisualPivot(x: number, y: number)
    {
        this.visualPivot = {
            x,
            y,
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

    public setPivot(localX: number, localY: number)
    {
        this.updateTransform();

        const p1 = this.getGlobalPoint(localX, localY);

        this.transform.pivot.x = localX;
        this.transform.pivot.y = localY;

        this.updateTransform();

        const p2 = this.getGlobalPoint(localX, localY);

        const deltaX = p1.x - p2.x;
        const deltaY = p1.y - p2.y;

        this.x += deltaX;
        this.y += deltaY;
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

    protected setOperation(operation: TransformOperation)
    {
        this.operation = operation;
    }

    public onMouseDown = (event: InteractionEvent) =>
    {
        this.dragInfo = {
            ...defaultDragInfo,
            event,
        };

        this.updateDragInfoFromEvent(event);

        const {
            dragInfo: { isMetaDown, isAltDown },
            isVertexDrag,
            config,
        } = this;

        if (isMetaDown && !isAltDown)
        {
            config.enableRotation && this.setOperation(new RotateOperation(this));
        }
        else if (isVertexDrag)
        {
            const { defaultScaleMode } = config;
            const PrimaryScaleOperation = defaultScaleMode === 'edge' ? ScaleByEdgeOperation : ScaleByPivotOperation;
            const SecondaryScaleOperation = defaultScaleMode === 'edge' ? ScaleByPivotOperation : ScaleByEdgeOperation;

            if (isMetaDown && isAltDown)
            {
                config.enableScaling && this.setOperation(new SecondaryScaleOperation(this));
            }
            else
            {
                config.enableScaling && this.setOperation(new PrimaryScaleOperation(this));
            }
        }
        else if (isAltDown)
        {
            config.enablePivotTranslation && this.setOperation(new TranslatePivotOperation(this));
        }
        else
        {
            config.enableTranslation && this.setOperation(new TranslateOperation(this));
        }

        if (this.operation)
        {
            this.operation.init(this.dragInfo);
            this.operation.drag(this.dragInfo);
        }

        this.update();

        this.frame.startOperation(this.dragInfo);
    };

    public onMouseMove = (event: InteractionEvent) =>
    {
        if (this.operation && this.dragInfo)
        {
            this.updateDragInfoFromEvent(event);
            this.operation.drag(this.dragInfo);

            this.update();
            this.frame.updateOperation(this.dragInfo);
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
            this.frame.endOperation(this.dragInfo);
        }

        this.clearOperation();
        this.updateSelectedModels();
    };

    public clearOperation()
    {
        this.vertex = { h: 'none', v: 'none' };

        delete this.operation;
        delete this.dragInfo;
    }

    public getContentGlobalBounds()
    {
        return getTotalGlobalBounds(this.selected);
    }

    public update()
    {
        this.updateTransform();
        this.updateSelectedTransforms();
        this.frame.update();

        if (!this.isVisible)
        {
            this.show();
        }
    }

    public updateTransform()
    {
        this.transform.updateLocalTransform();
    }

    public selectSingleNode<T extends ContainerNode>(node: T)
    {
        this.initTransform(getGizmoInitialTransformFromView(node));

        this.selected = [node];

        this.initNode(node);

        this.setConfig({
            pivotView: bluePivot,
        });

        this.update();
    }

    public selectMultipleNodes<T extends ContainerNode>(nodes: T[])
    {
        const rect = getTotalGlobalBounds(nodes);
        const centerX = rect.width * 0.5;
        const centerY = rect.height * 0.5;

        const matrix = new Matrix();

        matrix.translate(rect.left, rect.top);

        this.initTransform({
            ...defaultInitialGizmoTransform,
            localBounds: new Rectangle(0, 0, rect.width, rect.height),
            matrix,
            width: rect.width,
            height: rect.height,
            naturalWidth: rect.width,
            naturalHeight: rect.height,
            x: rect.left + centerX,
            y: rect.top + centerY,
            pivotX: centerX,
            pivotY: centerY,
        });

        this.selected = [...nodes];

        this.selected.forEach((node) =>
        {
            this.initNode(node);
        });

        this.setConfig({
            pivotView: yellowPivot,
        });

        this.update();
    }

    protected initTransform(transform: InitialGizmoTransform)
    {
        this.initialTransform = transform;

        this.transform = new Transform();
        this.transform.pivot.x = transform.pivotX;
        this.transform.pivot.y = transform.pivotY;
        this.transform.position.x = transform.x;
        this.transform.position.y = transform.y;
        this.transform.rotation = degToRad(transform.rotation);
        this.transform.scale.x = transform.scaleX;
        this.transform.scale.y = transform.scaleY;
        this.transform.skew.x = transform.skewX;
        this.transform.skew.y = transform.skewY;
    }

    protected initNode(node: ContainerNode)
    {
        const view = node.view;

        updateTransforms(view);
        view.interactive = true;

        const cachedMatrix = view.worldTransform.clone();

        if (view.parent && this.selected.length === 1)
        {
            const parentMatrix = view.parent.worldTransform.clone();

            parentMatrix.invert();
            cachedMatrix.prepend(parentMatrix);
        }

        this.matrixCache.set(node, cachedMatrix);
    }

    protected updateSelectedTransforms()
    {
        const thisMatrix = this.matrix;

        if (this.selected.length === 1)
        {
            const node = this.selected[0];
            const view = node.getView();
            const cachedMatrix = (this.matrixCache.get(node) as Matrix).clone();

            thisMatrix.prepend(this.initialTransform.matrix.clone().invert());
            cachedMatrix.append(thisMatrix);

            view.transform.setFromMatrix(cachedMatrix);
        }
        else
        {
            this.selected.forEach((node) =>
            {
                const view = node.getView();
                const cachedMatrix = (this.matrixCache.get(node) as Matrix).clone();

                cachedMatrix.prepend(this.initialTransform.matrix.clone().invert());
                cachedMatrix.prepend(thisMatrix);

                if (view.parent)
                {
                    const parentMatrix = view.parent.worldTransform.clone();

                    parentMatrix.invert();
                    cachedMatrix.prepend(parentMatrix);
                }

                view.transform.setFromMatrix(cachedMatrix);
            });
        }
    }

    public deselect()
    {
        this.selected.forEach((node) =>
        {
            const view = node.view;

            view.interactive = false;
        });
        this.selected.length = 0;
        this.matrixCache.clear();
        this.hide();
    }

    protected updateSelectedModels()
    {
        const { selected } = this;

        selected.forEach((node) =>
        {
            const view = node.view;

            updateTransforms(view);

            const pivotX = this.pivotX;
            const pivotY = this.pivotY;

            const x = view.x;
            const y = view.y;
            const scaleX = view.scale.x;
            const scaleY = view.scale.y;

            const matrix = view.worldTransform.clone();

            if (view.parent)
            {
                const parentMatrix = view.parent.worldTransform.clone();

                parentMatrix.invert();
                matrix.prepend(parentMatrix);
            }

            const transform = new Transform();

            decomposeTransform(transform, matrix, undefined, { x: pivotX, y: pivotY } as any);

            const angle = radToDeg(transform.rotation);
            const skewX = transform.skew.x;
            const skewY = transform.skew.y;

            const values: Partial<DisplayObjectModel> = {
                x,
                y,
                scaleX,
                scaleY,
                angle,
                skewX,
                skewY,
            };

            if (selected.length === 1)
            {
                values.pivotX = pivotX;
                values.pivotY = pivotY;
            }

            Application.instance.undoStack.exec(new ModifyModelCommand({
                nodeId: node.id,
                values,
            }));

            view.transform.setFromMatrix(matrix);
        });
    }
}
