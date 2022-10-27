import type { DisplayObject, InteractionEvent  } from 'pixi.js';
import { Container, Graphics, Matrix, Rectangle } from 'pixi.js';

import { displayObjectSchema } from '../../../core/nodes/abstract/displayObject';
import type { ContainerNode } from '../../../core/nodes/concrete/container';
import type{ DragHVertex,  DragVVertex } from '../../../core/util/geom';
import {
    angleBetween,
    closestEdgeVertexOnRect,
    degToRad,
    distanceBetween,
    findNearestPointOnRect,
    // getMatrixRotation,
    polarPoint,
    rotatePointAround,
} from '../../../core/util/geom';
import { Application } from '../../application';
import { ModifyModelCommand } from '../../commands/modifyModel';
import type { NodeSelection } from '../selection';
import type { TransformDragInfo, TransformGizmoConfig, TransformState } from './const';
import {
    bluePivot,
    defaultTransformDragInfo,
    defaultTransformGizmoConfig,
    defaultTransformState,
    yellowPivot,
} from './const';

export type DragMode = 'none' | 'pivot' | 'translation' | 'rotation' | 'scale';

export function round(num: number)
{
    return Math.round((num + Number.EPSILON) * 1000) / 1000;
}

export class TransformGizmo
{
    public bounds: Rectangle;
    public matrix: Matrix;
    public matrixCache: Map<ContainerNode, Matrix>;
    public state: TransformState;
    public cache: TransformState;
    public config: TransformGizmoConfig;
    public dragInfo: TransformDragInfo;
    public mode: DragMode;
    public border: Graphics;
    public pivotView: DisplayObject;

    public container: Container;

    constructor(public readonly selection: NodeSelection)
    {
        this.container = new Container();
        this.matrix = new Matrix();
        this.matrixCache = new Map();
        this.mode = 'none';
        this.state = { ...defaultTransformState };
        this.cache = { ...this.state };
        this.config = { ...defaultTransformGizmoConfig };
        this.dragInfo = { ...defaultTransformDragInfo };
        this.border = new Graphics();
        this.pivotView = this.config.pivotView;
        this.bounds = new Rectangle();

        this.container.addChild(this.border);
        this.container.addChild(this.pivotView);

        this.border.interactive = true;

        this.border
            .on('mousedown', this.onDragStart)
            .on('mousemove', this.onDragMove);

        window.addEventListener('mouseup', this.onDragEnd);

        this.selection
            .on('add', this.onSelectionAdd)
            .on('remove', this.onSelectionRemove);

        this.selection.forEach((node) => this.onSelectionAdd(node));

        if (this.selection.isEmpty)
        {
            this.hide();
        }
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected onSelectionAdd = (node: ContainerNode) =>
    {
        this.state = {
            ...defaultTransformState,
        };

        // configure for single or multiple selection
        this.initPivotMode();

        // update bounds
        this.bounds = this.getGlobalBounds();

        // cache view matrix
        this.updateCache();

        // setup correct state from selection
        this.initState();

        // full update
        this.update();

        // show if hidden
        if (!this.isVisible)
        {
            this.show();
        }
    };

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected onSelectionRemove = (node: ContainerNode) =>
    {
        // remove cached matrix
        this.matrixCache.delete(node);

        // configure for single or multiple selection
        this.initPivotMode();

        // update bounds
        this.bounds = this.getGlobalBounds();

        // hide if selection empty
        if (this.selection.isEmpty)
        {
            this.hide();
        }
        else
        {
            // update visuals
            this.updateBorder();
            this.updatePivot();
        }
    };

    public initPivotMode()
    {
        if (this.selection.length === 1)
        {
            // single mode
            this.setConfig({
                enableScaleByPivot: true,
                pivotView: bluePivot,
            });
        }
        else
        {
            // multimode
            this.setConfig({
                enableScaleByPivot: false,
                pivotView: yellowPivot,
            });
        }
    }

    protected updateCache()
    {
        this.matrixCache.clear();

        this.updateMatrix();

        this.selection.forEach((node) =>
        {
            const { matrix } = this;
            const view = node.getView();

            view.updateTransform();

            const cachedMatrix = view.worldTransform.clone();

            cachedMatrix.prepend(matrix.clone().invert());

            this.matrixCache.set(node, cachedMatrix);
        });
    }

    protected initState()
    {
        const { bounds, state, selection } = this;

        if (selection.length === 1)
        {
            const node = selection.firstNode as ContainerNode;
            const globalPivot = node.view.worldTransform.apply({ x: node.model.pivotX, y: node.model.pivotY });

            this.setPivot(globalPivot.x, globalPivot.y);
        }
        else
        {
            state.pivotX = bounds.width * 0.5;
            state.pivotY = bounds.height * 0.5;
        }
    }

    protected updateSelectedObjects()
    {
        const { matrix, selection, matrixCache } = this;

        // update selection with transformed matrix
        selection.forEach((node) =>
        {
            const view = node.getView();
            const cachedMatrix = (matrixCache.get(node) as Matrix).clone();

            cachedMatrix.prepend(matrix);

            if (view.parent)
            {
                view.parent.updateTransform();
                const parentMatrix = view.parent.worldTransform.clone();

                parentMatrix.invert();
                cachedMatrix.prepend(parentMatrix);
            }

            view.transform.setFromMatrix(cachedMatrix);
        });
    }

    protected updateNodeModels()
    {
        return;

        const { selection, state } = this;

        if (selection.length === 1)
        {
            const node = selection.firstNode as ContainerNode;

            node.view.updateTransform();

            const localMatrix = node.view.transform.localTransform;
            const ownValues = node.model.ownValues;
            const values: Record<string, number> = {};

            const x = round(localMatrix.tx);
            const y = round(localMatrix.ty);
            const rotation = round(state.rotation);

            const globalPivot = this.getPivotGlobalPos();
            const p = node.view.worldTransform.apply({ x: node.model.pivotX, y: node.model.pivotY });

            console.log(globalPivot.x - p.x);

            // (globalPivot.x !== p.x) && (values['pivotX'] = state.pivotX);
            // (globalPivot.y !== p.y) && (values['pivotY'] = state.pivotY);
            (x !== ownValues.x) && (values['x'] = x);
            (y !== ownValues.y) && (values['y'] = y);
            (rotation !== ownValues.angle) && (values['angle'] = rotation);
            // (scaleX !== ownValues.scaleX) && (values['scaleX'] = scaleX);
            // (scaleY !== ownValues.scaleY) && (values['scaleY'] = scaleY);
            this.updateNodeModel(node, values);
        }
        else
        {
            // selection.forEach((node) =>
            // {
            //     const view = node.view;
            //     const localMatrix = view.transform.localTransform;
            //     const ownValues = node.model.ownValues;

            //     const angle = getMatrixRotation(localMatrix);
            //     const x = localMatrix.tx;
            //     const y = localMatrix.ty;
            //     // const scaleX = localMatrix.a;
            //     // const scaleY = localMatrix.d;
            //     // const scaleX = state.scaleX;
            //     // const scaleY = state.scaleY;
            // });
        }
    }

    protected updateNodeModel(node: ContainerNode, values: Record<string, number>)
    {
        for (const [k, v] of Object.entries(values))
        {
            if (displayObjectSchema.defaults[k] === v)
            {
                delete values[k];
            }
        }

        // update if changed
        if (Object.keys(values).length > 0)
        {
            console.log('CHANGED:', values);

            Application.instance.exec(new ModifyModelCommand({
                nodeId: node.id,
                values,
            }));
        }
    }

    public updateMatrix()
    {
        const { bounds, matrix, state } = this;

        // reset transform matrix
        matrix.identity();

        // apply negative pivot
        matrix.translate(-state.pivotX, -state.pivotY);

        // scale
        matrix.scale(state.scaleX, state.scaleY);

        // rotate
        matrix.rotate(degToRad(state.rotation));

        // move pivot back
        matrix.translate(state.pivotX, state.pivotY);

        // translate to transform bounds position
        matrix.translate(bounds.left, bounds.top);

        // translate to transform translation position
        matrix.translate(state.x, state.y);
    }

    public show()
    {
        this.container.visible = true;
    }

    public hide()
    {
        this.container.visible = false;
    }

    public get isVisible()
    {
        return this.container.visible;
    }

    public getGlobalBounds()
    {
        let rect = new Rectangle();

        this.selection.forEach((node) =>
        {
            node.view.updateTransform();

            const bounds = node.getGlobalBounds();

            if (rect.width === 0 && rect.height === 0 && rect.x === 0 && rect.y === 0)
            {
                rect = bounds.clone();
            }
            else
            {
                rect.enlarge(bounds);
            }
        });

        return rect;
    }

    public setConfig(config: Partial<TransformGizmoConfig>)
    {
        this.config = {
            ...this.config,
            ...config,
        };

        if (config.pivotView)
        {
            this.container.removeChild(this.pivotView);
            this.container.addChild(config.pivotView);
            this.pivotView = config.pivotView;
            this.updatePivot();
        }
    }

    public setState(state: Partial<TransformState>)
    {
        this.state = {
            ...this.state,
            ...state,
        };

        this.update();
    }

    protected getPivotGlobalPos()
    {
        const { state, matrix } = this;
        const globalPoint = matrix.apply({ x: state.pivotX, y: state.pivotY });

        return globalPoint;
    }

    protected getLocalPoint(globalX: number, globalY: number)
    {
        const p = { x: globalX, y: globalY };
        const localPoint = this.matrix.applyInverse(p);

        return { x: localPoint.x, y: localPoint.y };
    }

    protected getGlobalPoint(localX: number, localY: number)
    {
        const p = { x: localX, y: localY };
        const globalPoint = this.matrix.apply(p);

        return { x: globalPoint.x, y: globalPoint.y };
    }

    protected constrainLocalPoint(localPoint: {x: number; y: number})
    {
        const { bounds } = this;
        const p = {
            ...localPoint,
        };

        p.x = Math.min(bounds.width, Math.max(0, localPoint.x));
        p.y = Math.min(bounds.height, Math.max(0, localPoint.y));

        return p;
    }

    protected setPivot(globalX: number, globalY: number)
    {
        const { state } = this;
        const { x: localX, y: localY } = this.getLocalPoint(globalX, globalY);

        // move pivot
        state.pivotX = localX;
        state.pivotY = localY;

        this.update();

        const newPoint = this.getPivotGlobalPos();
        const deltaX = newPoint.x - globalX;
        const deltaY = newPoint.y - globalY;

        state.x += -deltaX;
        state.y += -deltaY;

        this.update();
    }

    protected initDragState(mode: DragMode, e: InteractionEvent)
    {
        const { bounds, dragInfo, state } = this;
        const globalX = e.data.global.x;
        const globalY = e.data.global.y;
        const globalPivot = this.getPivotGlobalPos();
        const { x: localX, y: localY } = this.getLocalPoint(globalX, globalY);
        const { h, v } = closestEdgeVertexOnRect(localX, localY, 0, 0, bounds.width, bounds.height, 0.25);

        this.mode = mode;

        dragInfo.duplex = false;
        dragInfo.hVertex = h;
        dragInfo.vVertex = v;
        dragInfo.vertex = `${h}-${v}`;

        this.cache = {
            ...state,
        };

        dragInfo.width = bounds.width * state.scaleX;
        dragInfo.height = bounds.height * state.scaleY;
        dragInfo.angle = angleBetween(globalPivot.x, globalPivot.y, globalX, globalY);
        dragInfo.globalX = globalX;
        dragInfo.globalY = globalY;
    }

    /* pivot */

    protected initTranslatePivot(e: InteractionEvent)
    {
        const globalX = e.data.global.x;
        const globalY = e.data.global.y;

        this.initDragState('pivot', e);
        this.setPivot(globalX, globalY);
    }

    protected dragTranslatePivot(e: InteractionEvent)
    {
        const globalX = e.data.global.x;
        const globalY = e.data.global.y;
        const localPoint = this.getLocalPoint(globalX, globalY);

        if (e.data.originalEvent.altKey)
        {
            const p = this.constrainLocalPoint(localPoint);
            const gp = this.getGlobalPoint(p.x, p.y);

            this.setPivot(gp.x, gp.y);
        }
        else
        {
            this.setPivot(globalX, globalY);
        }
    }

    /* rotation */

    protected initRotation(e: InteractionEvent)
    {
        this.initDragState('rotation', e);
    }

    protected dragRotation(e: InteractionEvent)
    {
        const { dragInfo, state, cache } = this;
        const globalX = e.data.global.x;
        const globalY = e.data.global.y;
        const globalPivot = this.getPivotGlobalPos();
        const angle = angleBetween(globalPivot.x, globalPivot.y, globalX, globalY) - dragInfo.angle;

        state.rotation = cache.rotation + angle;
    }

    /* translation */

    protected initTranslation(e: InteractionEvent)
    {
        this.initDragState('translation', e);
    }

    protected dragTranslation(e: InteractionEvent)
    {
        const { dragInfo, state, cache } = this;
        const globalX = e.data.global.x;
        const globalY = e.data.global.y;
        const deltaX = globalX - dragInfo.globalX;
        const deltaY = globalY - dragInfo.globalY;

        state.x = cache.x + deltaX;
        state.y = cache.y + deltaY;
    }

    /* scale */

    protected initScale(e: InteractionEvent)
    {
        const { dragInfo, config: { enableScaleByPivot } } = this;
        const isAltDown = e.data.originalEvent.altKey;

        // override pivot and cache state
        this.initDragState('scale', e);

        if (isAltDown)
        {
            // enabled duplex
            dragInfo.duplex = true;
            if (enableScaleByPivot)
            {
                this.setPivotFromScaleMode(dragInfo.hVertex, dragInfo.vVertex);
            }
            else
            {
                this.setPivotFromScaleMode('center', 'center');
            }
        }
        else
        if (!enableScaleByPivot)
        {
            // scale from absolute edges not pivot
            this.setPivotFromScaleMode(dragInfo.hVertex, dragInfo.vVertex);
        }
    }

    protected dragScale(e: InteractionEvent)
    {
        const { dragInfo, state, cache, config: { enableScaleByPivot } } = this;
        const isAltDown = e.data.originalEvent.altKey;
        const globalX = e.data.global.x;
        const globalY = e.data.global.y;
        const width = dragInfo.width;
        const height = dragInfo.height;
        const dragPointX = dragInfo.globalX;
        const dragPointY = dragInfo.globalY;
        const globalPivot = this.getPivotGlobalPos();
        const { x: localX, y: localY } = this.getLocalPoint(globalX, globalY);
        const p1 = rotatePointAround(globalX, globalY, -state.rotation, globalPivot.x, globalPivot.y);
        const p2 = rotatePointAround(dragPointX, dragPointY, -state.rotation, globalPivot.x, globalPivot.y);
        let deltaX = (p1.x - p2.x);
        let deltaY = (p1.y - p2.y);
        let scaleX = 1;
        let scaleY = 1;

        if (isAltDown)
        {
            if (!dragInfo.duplex)
            {
                // reset drag scaling state
                this.onDragEnd();
                this.initScale(e);

                // enabled duplex
                dragInfo.duplex = true;
                this.setPivotFromScaleMode('center', 'center');

                return;
            }
        }
        else
        if (dragInfo.duplex)
        {
            // disable duplex
            dragInfo.duplex = false;

            // reset drag scaling state
            this.onDragEnd();
            this.initScale(e);
            this.update();

            return;
        }

        const { vertex } = dragInfo;

        if (dragInfo.duplex && !enableScaleByPivot)
        {
            // apply duplex multiplier
            deltaX *= 2;
            deltaY *= 2;
        }
        else if (enableScaleByPivot)
        {
            // adjust according to local pos relative to pivot
            if (localX < state.pivotX)
            {
                deltaX *= 1 / state.pivotX;
            }
            else
            {
                deltaX *= 1 / (1.0 - state.pivotX);
            }
            if (localY < state.pivotY)
            {
                deltaY *= 1 / state.pivotY;
            }
            else
            {
                deltaY *= 1 / (1.0 - state.pivotY);
            }
        }

        if (
            vertex === 'left-top'
                || vertex === 'left-center'
                || vertex === 'left-bottom'
        )
        {
            deltaX *= -1;
        }

        if (
            vertex === 'left-top'
                || vertex === 'center-top'
                || vertex === 'right-top'
        )
        {
            deltaY *= -1;
        }

        if (
            vertex === 'left-top'
                || vertex === 'left-center'
                || vertex === 'left-bottom'
                || vertex === 'right-top'
                || vertex === 'right-center'
                || vertex === 'right-bottom'
        )
        {
            scaleX = ((width + deltaX) / width) * cache.scaleX;
            state.scaleX = scaleX;
        }

        if (
            vertex === 'left-top'
                || vertex === 'center-top'
                || vertex === 'right-top'
                || vertex === 'left-bottom'
                || vertex === 'center-bottom'
                || vertex === 'right-bottom'
        )
        {
            scaleY = ((height + deltaY) / height) * cache.scaleY;
            state.scaleY = scaleY;
        }

        if (isNaN(state.scaleX))
        {
            state.scaleX = cache.scaleX;
        }

        if (isNaN(state.scaleY))
        {
            state.scaleY = cache.scaleY;
        }
    }

    protected setPivotFromScaleMode(hVertex: DragHVertex, vVertex: DragVVertex)
    {
        const { bounds } = this;

        let h = 0.5;
        let v = 0.5;

        if (hVertex === 'left')
        {
            h = 1;
        }
        else if (hVertex === 'right')
        {
            h = 0;
        }

        if (vVertex === 'top')
        {
            v = 1;
        }
        else if (vVertex === 'bottom')
        {
            v = 0;
        }

        const localX = bounds.width * h;
        const localY = bounds.height * v;

        const p = this.getGlobalPoint(localX, localY);

        this.setPivot(p.x, p.y);
    }

    protected restoreCachedPivot()
    {
        const { cache } = this;
        const localX = cache.pivotX;
        const localY = cache.pivotY;
        const p = this.getGlobalPoint(localX, localY);

        this.setPivot(p.x, p.y);
    }

    protected updateBorder()
    {
        const { bounds, border, matrix, config } = this;

        border.clear();

        if (config.showEncompassingBorder)
        {
            // todo: can use bounds without recalc?
            const totalBounds = this.getGlobalBounds();

            // draw encompassing encompassing border
            border.lineStyle(1, 0xffffff, 0.6);
            border.beginFill(0xffffff, 0.01);
            border.drawRect(totalBounds.left, totalBounds.top, totalBounds.width, totalBounds.height);
            border.endFill();
        }

        const p1 = matrix.apply({ x: 0, y: 0 });
        const p2 = matrix.apply({ x: bounds.width, y: 0 });
        const p3 = matrix.apply({ x: bounds.width, y: bounds.height });
        const p4 = matrix.apply({ x: 0, y: bounds.height });

        // draw transformed border
        const path = [p1.x, p1.y, p2.x, p2.y, p3.x, p3.y, p4.x, p4.y];

        border.beginFill(0xffffff, 0.1);
        border.drawPolygon(path);
        border.endFill();

        border.lineStyle(1, 0xffffff, 1);
        border.moveTo(p1.x, p1.y); border.lineTo(p2.x, p2.y);
        border.moveTo(p2.x, p2.y); border.lineTo(p3.x, p3.y);
        border.moveTo(p3.x, p3.y); border.lineTo(p4.x, p4.y);
        border.moveTo(p4.x, p4.y); border.lineTo(p1.x, p1.y);

        if (config.showPrimaryHandles)
        {
            // draw primary handles
            const size = config.handlePrimarySize;

            this.drawHandle(0, 0, size);
            this.drawHandle(bounds.width, 0, size);
            this.drawHandle(bounds.width, bounds.height, size);
            this.drawHandle(0, bounds.height, size);
        }

        if (config.showSecondaryHandles)
        {
            // draw smaller handles
            const size = config.handleSecondarySize;
            const halfWidth = bounds.width * 0.5;
            const halfHeight = bounds.height * 0.5;

            this.drawHandle(halfWidth, 0, size);
            this.drawHandle(bounds.width, halfHeight, size);
            this.drawHandle(halfWidth, bounds.height, size);
            this.drawHandle(0, halfHeight, size);
        }
    }

    protected drawHandle(localX: number, localY: number, size: number)
    {
        const { matrix, border, state: { rotation } } = this;
        const p = matrix.apply({ x: localX, y: localY });

        const topLeft = polarPoint(rotation + 180 + 45, size, p.x, p.y);
        const topRight = polarPoint(rotation - 45, size, p.x, p.y);
        const bottomRight = polarPoint(rotation + 45, size, p.x, p.y);
        const bottomLeft = polarPoint(rotation + 180 - 45, size, p.x, p.y);

        const path = [topLeft, topRight, bottomRight, bottomLeft, topLeft];

        border.lineStyle(1, 0x000000, 0.5);
        border.beginFill(0xffffff, 1);
        border.drawPolygon(path);
        border.endFill();
    }

    protected updatePivot()
    {
        const { matrix, state, mode, cache, pivotView, config } = this;

        if (config.showPivot)
        {
            if (mode === 'scale')
            {
                const localPoint = {
                    x: cache.pivotX,
                    y: cache.pivotY,
                };
                const p = matrix.apply(localPoint);

                pivotView.x = p.x;
                pivotView.y = p.y;
            }
            else
            {
                const p = this.getPivotGlobalPos();

                pivotView.x = p.x;
                pivotView.y = p.y;
            }

            pivotView.angle = state.rotation;
            pivotView.visible = true;
        }
        else
        {
            pivotView.visible = false;
        }
    }

    public update(updateObjects = true)
    {
        this.updateMatrix();
        if (updateObjects)
        {
            this.updateSelectedObjects();
        }
        this.updateBorder();
        this.updatePivot();
    }

    public onDragStart = (e: InteractionEvent) =>
    {
        const { bounds, config } = this;
        const globalX = e.data.global.x;
        const globalY = e.data.global.y;

        const { x: localX, y: localY } = this.getLocalPoint(globalX, globalY);

        if (e.data.buttons === 1)
        {
            if (e.data.originalEvent.shiftKey)
            {
                // translate pivot
                config.enablePivotTranslation && this.initTranslatePivot(e);
            }
            else if (e.data.originalEvent.metaKey)
            {
                // rotation
                config.enableRotation && this.initRotation(e);
            }
            else
            {
                const { x, y } = findNearestPointOnRect(
                    localX,
                    localY,
                    0,
                    0,
                    bounds.width,
                    bounds.height,
                );

                const p = this.getGlobalPoint(x, y);

                const distance = distanceBetween(p.x, p.y, globalX, globalY);

                if (distance <= this.config.edgeDragDistance)
                {
                    // scaling
                    config.enableScaling && this.initScale(e);
                }
                else
                {
                    // translation
                    config.enableTranslation && this.initTranslation(e);
                }
            }
        }

        this.update();
    };

    public onDragMove = (e: InteractionEvent) =>
    {
        const { mode } = this;

        if (mode === 'pivot' && e.data.originalEvent.shiftKey && e.data.buttons === 1)
        {
            // move pivot
            this.dragTranslatePivot(e);
        }
        else if (mode === 'translation')
        {
            // translation
            this.dragTranslation(e);
        }
        else if (mode === 'rotation')
        {
            // rotation
            this.dragRotation(e);
        }
        else if (mode === 'scale')
        {
            // scaling
            this.dragScale(e);
        }

        if (mode !== 'none')
        {
            this.update();

            e.stopPropagation();
        }
    };

    public onDragEnd = () =>
    {
        const { mode } = this;

        if (mode !== 'none')
        {
            if (mode === 'scale')
            {
                // restore cached pivot when scaling
                this.restoreCachedPivot();
            }

            this.mode = 'none';

            this.updateNodeModels();
        }
    };
}
