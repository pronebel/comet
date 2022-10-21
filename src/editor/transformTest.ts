import type {  InteractionEvent,  Transform } from 'pixi.js';
import { Application, Container, Graphics, Matrix, Rectangle, Sprite, Texture } from 'pixi.js';

import type { DragHVertex, DragVVertex, RectSide  } from '../core/util/geom';
import {
    angleBetween,
    closestEdgeVertexOnRect,
    degToRad,
    findNearestPointOnRect,
    rotatePointAround,
} from '../core/util/geom';
import Canvas2DPainter from './ui/2dPainter';
import Grid from './ui/grid';

const edgeDragDistance = 15;

// setup transform state
const transform = {
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
    scale: {
        hVertex: DragHVertex;
        vVertex: DragVVertex;
        side: RectSide;
        duplex: boolean;
        centerX: number;
        centerY: number;
        vertex: string;
    };
    initial: {
        width: number;
        height: number;
        dragAngle: number;
        dragPointX: number;
        dragPointY: number;
        dragScaleEdgeX: number;
        dragScaleEdgeY: number;
    };
}

const dragInfo: DragInfo = {
    mode: 'none',
    cache: transform,
    scale: {
        hVertex: 'center',
        vVertex: 'center',
        side: 'right',
        duplex: false,
        centerX: 0,
        centerY: 0,
        vertex: '',
    },
    initial: {
        width: 0,
        height: 0,
        dragAngle: 0,
        dragPointX: 0,
        dragPointY: 0,
        dragScaleEdgeX: 0,
        dragScaleEdgeY: 0,
    },
};

type WithBounds = {getBounds: () => Rectangle};
const selection: WithBounds[] = [];

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
    green: { x: 250, y: 50, width: 50, height: 100, angle: 0, pivotX: 0, pivotY: 0 },
    blue: { x: 150, y: 150, width: 50, height: 50, angle: 0, pivotX: 0, pivotY: 0 },
};

const red = createSprite(0xff0000, spriteConfig.red);
const green = createSprite(0x009900, spriteConfig.green);
const blue = createSprite(0x0000ff, spriteConfig.blue);

selection.push(red, green, blue);

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

// update transforms before caching matrices
red.updateTransform();
green.updateTransform();
blue.updateTransform();

// calculate bounds
const bounds = sprites.getBounds();

// create transform display objects
const border = new Graphics();
const container = new Container();

edit.addChild(container);
edit.addChild(border);

border.interactive = true;

function createPoint(tint: number, size = 10)
{
    const point = new Sprite(Texture.WHITE);

    point.tint = tint;
    point.width = point.height = size;
    point.pivot.x = size * 0.5;
    point.pivot.y = size * 0.5;

    container.addChild(point);

    return point;
}

const points = {
    pivot: createPoint(0xffffff),
    nearest: createPoint(0xffff00, 13),
    mouseLocal: createPoint(0x00ffff, 7),
};

const setPoint = (name: keyof typeof points, localX: number, localY: number) =>
{
    const point = points[name];

    point.x = localX;
    point.y = localY;
};

// cache matrices
const matrixCache = {
    red: red.worldTransform.clone(),
    green: green.worldTransform.clone(),
    blue: blue.worldTransform.clone(),
};

// run transform operation
function getPivotGlobalPos()
{
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
    const p = {
        ...localPoint,
    };

    p.x = Math.min(bounds.width, Math.max(0, localPoint.x));
    p.y = Math.min(bounds.height, Math.max(0, localPoint.y));

    return p;
}

function initDragState(mode: DragMode, e: InteractionEvent)
{
    const globalX = e.data.global.x;
    const globalY = e.data.global.y;
    const globalPivot = getPivotGlobalPos();
    const localPoint = getLocalPoint(globalX, globalY);

    dragInfo.mode = mode;

    dragInfo.cache = {
        ...transform,
    };

    dragInfo.initial = {
        width: bounds.width * transform.scaleX,
        height: bounds.height * transform.scaleY,
        dragAngle: angleBetween(globalPivot.x, globalPivot.y, globalX, globalY),
        dragPointX: globalX,
        dragPointY: globalY,
        dragScaleEdgeX: localPoint.x,
        dragScaleEdgeY: localPoint.y,
    };
}

const updateMatrix = (trans: Transform, origMatrix: Matrix) =>
{
    const combinedMatrix = origMatrix.clone();

    combinedMatrix.translate(-bounds.left, -bounds.top);
    combinedMatrix.prepend(transform.matrix);
    trans.setFromMatrix(combinedMatrix);
};

function fitBorder()
{
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
    let h = 0.5; // left
    let v = 0.5; // top

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
    const { matrix } = transform;

    const pivotX = bounds.width * transform.pivotX;
    const pivotY = bounds.height * transform.pivotY;

    // if (dragInfo.mode !== 'scale')
    // {
    //     setPoint('pivot', pivotX, pivotY);
    // }
    setPoint('pivot', pivotX, pivotY);

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

    // update sprites with transform matrix
    updateMatrix(red.transform, matrixCache.red);
    updateMatrix(green.transform, matrixCache.green);
    updateMatrix(blue.transform, matrixCache.blue);

    // fit uniform encompassing border
    fitBorder();
}

const onDragStart = (e: InteractionEvent) =>
{
    const globalX = e.data.global.x;
    const globalY = e.data.global.y;

    const { x: localX, y: localY } = getLocalPoint(globalX, globalY);

    // setPoint('mouseLocal', localX, localY);

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
            const { distance, side } = findNearestPointOnRect(
                localX,
                localY,
                0,
                0,
                bounds.width,
                bounds.height,
            );

            if (distance <= edgeDragDistance)
            {
                // scaling
                const { h, v } = closestEdgeVertexOnRect(localX, localY, 0, 0, bounds.width, bounds.height, 0.25);

                // cache extra scale info
                dragInfo.scale.hVertex = h;
                dragInfo.scale.vVertex = v;
                dragInfo.scale.side = side;
                dragInfo.scale.vertex = `${h}-${v}`;
                console.log(dragInfo.scale.vertex);

                // override pivot and cache state
                initDragState('scale', e);
                setPivotFromScaleMode(h, v);
            }
            else
            {
                // translation
                initDragState('translation', e);
            }
        }
    }
};

const onDragMove = (e: InteractionEvent) =>
{
    const globalX = e.data.global.x;
    const globalY = e.data.global.y;

    const localPoint = getLocalPoint(globalX, globalY);
    const localX = localPoint.x;
    const localY = localPoint.y;

    // localPoint = constrainLocalPoint(localPoint);

    const globalPivot = getPivotGlobalPos();

    const { x, y } = findNearestPointOnRect(
        localX,
        localY,
        0,
        0,
        bounds.width,
        bounds.height,
    );

    setPoint('nearest', x, y);
    setPoint('mouseLocal', localPoint.x, localPoint.y);

    if (dragInfo.mode === 'rotation')
    {
        // rotation
        const angle = angleBetween(globalPivot.x, globalPivot.y, globalX, globalY) - dragInfo.initial.dragAngle;

        transform.rotation = dragInfo.cache.rotation + angle;
    }
    else if (dragInfo.mode === 'translation')
    {
        // drag
        const deltaX = globalX - dragInfo.initial.dragPointX;
        const deltaY = globalY - dragInfo.initial.dragPointY;

        transform.x = dragInfo.cache.x + deltaX;
        transform.y = dragInfo.cache.y + deltaY;
    }
    else if (dragInfo.mode === 'scale')
    {
        // scaling
        const width = dragInfo.initial.width;
        const height = dragInfo.initial.height;
        const dragPointX = dragInfo.initial.dragPointX;
        const dragPointY = dragInfo.initial.dragPointY;
        const p1 = rotatePointAround(globalX, globalY, -transform.rotation, globalPivot.x, globalPivot.y);
        const p2 = rotatePointAround(dragPointX, dragPointY, -transform.rotation, globalPivot.x, globalPivot.y);
        let deltaX = (p1.x - p2.x);
        let deltaY = (p1.y - p2.y);
        let scaleX = 1;
        let scaleY = 1;

        if (e.data.originalEvent.altKey)
        {
            if (!dragInfo.scale.duplex)
            {
                // enabled duplex
                dragInfo.scale.duplex = true;
                setPivotFromScaleMode('center', 'center');
            }
        }
        else
        if (dragInfo.scale.duplex)
        {
            // disable duplex
            dragInfo.scale.duplex = false;
            setPivotFromScaleMode(dragInfo.scale.hVertex, dragInfo.scale.vVertex);
        }

        const { duplex, vertex } = dragInfo.scale;

        if (duplex)
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

const onDragEnd = () =>
{
    if (dragInfo.mode === 'scale')
    {
        // restore cached pivot when scaling
        const localX = bounds.width * dragInfo.cache.pivotX;
        const localY = bounds.height * dragInfo.cache.pivotY;
        const p = getGlobalPoint(localX, localY);

        setPivot(p.x, p.y);
    }

    dragInfo.mode = 'none';
};

border
    .on('mousedown', onDragStart)
    .on('mousemove', onDragMove);

window.addEventListener('mouseup', onDragEnd);

setInterval(calcTransform, 100);
