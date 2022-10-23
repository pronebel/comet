import type { DisplayObject, InteractionEvent, Transform } from 'pixi.js';
import { Application, Container, Graphics, Matrix, Rectangle, Sprite, Texture } from 'pixi.js';

import type { DragHVertex, DragVVertex } from '../core/util/geom';
import {
    angleBetween,
    closestEdgeVertexOnRect,
    degToRad,
    distanceBetween,
    findNearestPointOnRect,
    rotatePointAround } from '../core/util/geom';
import Canvas2DPainter from './ui/2dPainter';
import Grid from './ui/grid';

const edgeDragDistance = 15;

// setup transform state
const transform = {
    bounds: new Rectangle(),
    matrix: new Matrix(),
    x: 0,
    y: 0,
    pivotX: 0.5,
    pivotY: 0.5,
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
};

type SpriteConfig = {
    x: number;
    y: number;
    width: number;
    height: number;
    angle: number;
    pivotX: number;
    pivotY: number;
};

// track drag info
type DragMode = 'none' | 'translation' | 'rotation' | 'scale';

interface DragInfo
{
    mode: DragMode;
    cache: typeof transform;
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

const dragInfo: DragInfo = {
    mode: 'none',
    cache: transform,
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

const selection: DisplayObject[] = [];
const matrixCache: Matrix[] = [];

// create canvas and setup pixi
const canvasWidth = 500;
const canvasHeight = 500;
const painter = new Canvas2DPainter(canvasWidth, canvasHeight, '#ccc');

document.body.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: crosshair;
`;
document.body.appendChild(painter.canvas);

const pixi = new Application({
    view: painter.canvas,
    width: canvasWidth,
    height: canvasHeight,
});

const sprites = new Container();
const edit = new Container();

pixi.stage.addChild(Grid.createTilingSprite(screen.availWidth, screen.availHeight));
pixi.stage.addChild(sprites);
pixi.stage.addChild(edit);

function createSprite(tint: number, config: SpriteConfig, addToStage = true)
{
    const sprite = new Sprite(Texture.WHITE);

    sprite.tint = tint;
    sprite.width = config.width;
    sprite.height = config.height;
    sprite.x = config.x;
    sprite.y = config.y;
    sprite.angle = config.angle;
    sprite.pivot.x = config.pivotX;
    sprite.pivot.y = config.pivotY;

    if (addToStage)
    {
        sprites.addChild(sprite);
        sprite.updateTransform();
    }

    return sprite;
}

// create 3 sprites and setup properties
const spriteConfig: Record<string, SpriteConfig> = {
    red: { x: 100, y: 50, width: 100, height: 50, angle: 0, pivotX: 0, pivotY: 0 },
    green: { x: 250, y: 50, width: 50, height: 100, angle: 45, pivotX: 0, pivotY: 0 },
    blue: { x: 150, y: 150, width: 50, height: 50, angle: 0, pivotX: 0, pivotY: 0 },
};

const red = createSprite(0xff0000, spriteConfig.red);
const green = createSprite(0x009900, spriteConfig.green);
const blue = createSprite(0x0000ff, spriteConfig.blue);

// initialise selection
function addObject(view: DisplayObject)
{
    view.updateTransform();
    selection.push(view);
    matrixCache.push(view.worldTransform.clone());
}

function addObjects(views: DisplayObject[])
{
    views.forEach((view) =>
    {
        addObject(view);
    });
}

function getBounds()
{
    let rect = new Rectangle();

    for (const obj of selection)
    {
        const bounds = obj.getBounds();

        if (rect.width === 0 && rect.height === 0 && rect.x === 0 && rect.y === 0)
        {
            rect = bounds;
        }
        else
        {
            rect.enlarge(bounds);
        }
    }

    return rect;
}

// create transform display objects
const border = new Graphics();
const container = new Container();

edit.addChild(container);
edit.addChild(border);

border.interactive = true;

const pivot = new Container();
const pivotShape = new Graphics();
const pivotSize = 10;

pivot.addChild(pivotShape);
pivotShape.lineStyle(1, 0xffff00, 1);
pivotShape.beginFill(0xffffff, 0.001);
pivotShape.drawCircle(0, 0, pivotSize);
pivotShape.moveTo(0, pivotSize * -1.5);
pivotShape.lineTo(0, pivotSize * 1.5);
pivotShape.moveTo(pivotSize * -1.5, 0);
pivotShape.lineTo(pivotSize * 1.5, 0);
pivotShape.endFill();

edit.addChild(pivot);

const setPivotViewPos = () =>
{
    const p = getPivotGlobalPos();

    pivot.x = p.x;
    pivot.y = p.y;
};

// run transform operation
function getPivotGlobalPos()
{
    const { bounds } = transform;
    const localPoint = { x: transform.pivotX * bounds.width, y: transform.pivotY * bounds.height };
    const globalPoint = { x: 0, y: 0 };

    container.worldTransform.apply(localPoint, globalPoint);

    return globalPoint;
}

function getLocalPoint(globalX: number, globalY: number)
{
    const p = { x: globalX, y: globalY };
    const localPoint = container.worldTransform.applyInverse(p);

    return { x: localPoint.x, y: localPoint.y };
}

function getGlobalPoint(localX: number, localY: number)
{
    const p = { x: localX, y: localY };
    const globalPoint = container.worldTransform.apply(p);

    return { x: globalPoint.x, y: globalPoint.y };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function constrainLocalPoint(localPoint: {x: number; y: number})
{
    const { bounds } = transform;
    const p = {
        ...localPoint,
    };

    p.x = Math.min(bounds.width, Math.max(0, localPoint.x));
    p.y = Math.min(bounds.height, Math.max(0, localPoint.y));

    return p;
}

function initDragState(mode: DragMode, e: InteractionEvent)
{
    const { bounds } = transform;
    const globalX = e.data.global.x;
    const globalY = e.data.global.y;
    const globalPivot = getPivotGlobalPos();
    const { x: localX, y: localY } = getLocalPoint(globalX, globalY);
    const { h, v } = closestEdgeVertexOnRect(localX, localY, 0, 0, bounds.width, bounds.height, 0.25);

    dragInfo.mode = mode;

    dragInfo.duplex = false;
    dragInfo.hVertex = h;
    dragInfo.vVertex = v;
    dragInfo.vertex = `${h}-${v}`;

    dragInfo.cache = {
        ...transform,
    };

    dragInfo.width = bounds.width * transform.scaleX;
    dragInfo.height = bounds.height * transform.scaleY;
    dragInfo.angle = angleBetween(globalPivot.x, globalPivot.y, globalX, globalY);
    dragInfo.globalX = globalX;
    dragInfo.globalY = globalY;
}

const updateMatrix = (trans: Transform, origMatrix: Matrix) =>
{
    const { bounds } = transform;
    const combinedMatrix = origMatrix.clone();

    combinedMatrix.translate(-bounds.left, -bounds.top);
    combinedMatrix.prepend(transform.matrix);
    trans.setFromMatrix(combinedMatrix);
};

function fitBorder()
{
    const { bounds } = transform;
    const uniformBounds = getBounds();

    border.clear();

    // draw uniform encompassing border
    border.lineStyle(1, 0xffffff, 0.6);
    border.beginFill(0xffffff, 0.01);
    border.drawRect(uniformBounds.left, uniformBounds.top, uniformBounds.width, uniformBounds.height);
    border.endFill();

    const p1 = container.worldTransform.apply({ x: 0, y: 0 });
    const p2 = container.worldTransform.apply({ x: bounds.width, y: 0 });
    const p3 = container.worldTransform.apply({ x: bounds.width, y: bounds.height });
    const p4 = container.worldTransform.apply({ x: 0, y: bounds.height });

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
}

function setPivot(globalX: number, globalY: number)
{
    const { bounds } = transform;
    const { x: localX, y: localY } = getLocalPoint(globalX, globalY);

    // move pivot
    transform.pivotX = localX / bounds.width;
    transform.pivotY = localY / bounds.height;

    calcTransform();

    const newPoint = getPivotGlobalPos();
    const deltaX = newPoint.x - globalX;
    const deltaY = newPoint.y - globalY;

    transform.x += -deltaX;
    transform.y += -deltaY;

    calcTransform();
}

function setPivotFromScaleMode(hVertex: DragHVertex, vVertex: DragVVertex)
{
    const { bounds } = transform;

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

    const p = getGlobalPoint(localX, localY);

    setPivot(p.x, p.y);
}

function calcTransform()
{
    const { bounds } = transform;
    const { matrix } = transform;

    const pivotX = bounds.width * transform.pivotX;
    const pivotY = bounds.height * transform.pivotY;

    if (dragInfo.mode === 'scale')
    {
        const localPoint = {
            x: dragInfo.cache.pivotX * bounds.width,
            y: dragInfo.cache.pivotY * bounds.height,
        };
        const p = container.worldTransform.apply(localPoint);

        pivot.x = p.x;
        pivot.y = p.y;
    }
    else
    {
        setPivotViewPos();
    }

    pivot.angle = transform.rotation;

    // reset transform matrix
    matrix.identity();

    // apply negative pivot
    matrix.translate(-pivotX, -pivotY);

    // scale
    matrix.scale(transform.scaleX, transform.scaleY);

    // rotate
    matrix.rotate(degToRad(transform.rotation));

    // move pivot back
    matrix.translate(pivotX, pivotY);

    // translate to transform bounds position
    matrix.translate(bounds.left, bounds.top);

    // translate to transform translation position
    matrix.translate(transform.x, transform.y);

    // update transform container with matrix
    container.transform.setFromMatrix(matrix);
    container.updateTransform();

    // update selection with transformed matrix
    for (let i = 0; i < selection.length; i++)
    {
        const view = selection[i];
        const cachedMatrix = matrixCache[i];

        updateMatrix(view.transform, cachedMatrix);
    }

    // fit uniform encompassing border
    fitBorder();
}

function initScaling(e: InteractionEvent)
{
    // override pivot and cache state
    initDragState('scale', e);

    if (e.data.originalEvent.altKey)
    {
        // enabled duplex
        dragInfo.duplex = true;
        setPivotFromScaleMode('center', 'center');
    }
    else
    {
        setPivotFromScaleMode(dragInfo.hVertex, dragInfo.vVertex);
    }
}

const onDragStart = (e: InteractionEvent) =>
{
    const { bounds } = transform;
    const globalX = e.data.global.x;
    const globalY = e.data.global.y;

    const { x: localX, y: localY } = getLocalPoint(globalX, globalY);

    if (e.data.buttons === 1)
    {
        if (e.data.originalEvent.shiftKey)
        {
            // move pivot
            setPivot(globalX, globalY);
        }
        else if (e.data.originalEvent.metaKey)
        {
            // rotation
            initDragState('rotation', e);
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

            const p = getGlobalPoint(x, y);

            const distance = distanceBetween(p.x, p.y, globalX, globalY);

            if (distance <= edgeDragDistance)
            {
                // scaling
                initScaling(e);
            }
            else
            {
                // translation
                initDragState('translation', e);
            }
        }
    }

    calcTransform();
};

const onDragEnd = () =>
{
    const { bounds } = transform;

    if (dragInfo.mode === 'scale')
    {
        // restore cached pivot when scaling
        const localX = bounds.width * dragInfo.cache.pivotX;
        const localY = bounds.height * dragInfo.cache.pivotY;
        const p = getGlobalPoint(localX, localY);

        setPivot(p.x, p.y);
    }

    dragInfo.mode = 'none';

    calcTransform();
};

const onDragMove = (e: InteractionEvent) =>
{
    const globalX = e.data.global.x;
    const globalY = e.data.global.y;

    const localPoint = getLocalPoint(globalX, globalY);

    if (e.data.originalEvent.shiftKey && e.data.buttons === 1)
    {
        // move pivot
        if (e.data.originalEvent.altKey)
        {
            const p = constrainLocalPoint(localPoint);
            const gp = getGlobalPoint(p.x, p.y);

            setPivot(gp.x, gp.y);
        }
        else
        {
            setPivot(globalX, globalY);
        }
    }

    const globalPivot = getPivotGlobalPos();

    if (dragInfo.mode === 'rotation')
    {
        // rotation
        const angle = angleBetween(globalPivot.x, globalPivot.y, globalX, globalY) - dragInfo.angle;

        transform.rotation = dragInfo.cache.rotation + angle;
    }
    else if (dragInfo.mode === 'translation')
    {
        // translation
        const deltaX = globalX - dragInfo.globalX;
        const deltaY = globalY - dragInfo.globalY;

        transform.x = dragInfo.cache.x + deltaX;
        transform.y = dragInfo.cache.y + deltaY;
    }
    else if (dragInfo.mode === 'scale')
    {
        // scaling
        const width = dragInfo.width;
        const height = dragInfo.height;
        const dragPointX = dragInfo.globalX;
        const dragPointY = dragInfo.globalY;
        const p1 = rotatePointAround(globalX, globalY, -transform.rotation, globalPivot.x, globalPivot.y);
        const p2 = rotatePointAround(dragPointX, dragPointY, -transform.rotation, globalPivot.x, globalPivot.y);
        let deltaX = (p1.x - p2.x);
        let deltaY = (p1.y - p2.y);
        let scaleX = 1;
        let scaleY = 1;

        if (e.data.originalEvent.altKey)
        {
            if (!dragInfo.duplex)
            {
                // reset drag scaling state
                onDragEnd();
                initScaling(e);

                // enabled duplex
                dragInfo.duplex = true;
                setPivotFromScaleMode('center', 'center');

                return;
            }
        }
        else
        if (dragInfo.duplex)
        {
            // disable duplex
            dragInfo.duplex = false;

            // reset drag scaling state
            onDragEnd();
            initScaling(e);

            return;
        }

        const { vertex } = dragInfo;

        if (dragInfo.duplex)
        {
            // apply duplex multiplier
            deltaX *= 2;
            deltaY *= 2;
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
            scaleX = ((width + deltaX) / width) * dragInfo.cache.scaleX;
            transform.scaleX = scaleX;
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
            scaleY = ((height + deltaY) / height) * dragInfo.cache.scaleY;
            transform.scaleY = scaleY;
        }
    }

    calcTransform();
};

border
    .on('mousedown', onDragStart)
    .on('mousemove', onDragMove);

window.addEventListener('mouseup', onDragEnd);

// add objects
addObjects([red, green, blue]);

// init to calculate bounds
transform.bounds = sprites.getBounds();

setInterval(calcTransform, 100);
