import type { InteractionEvent, Transform } from 'pixi.js';
import { Application, Container, Graphics, Matrix, Sprite, Texture } from 'pixi.js';

import { angleBetween, degToRad, findNearestPointOnRect } from '../core/util/geom';
import Canvas2DPainter from './ui/2dPainter';
import Grid from './ui/grid';

type SpriteConfig = {
    x: number;
    y: number;
    width: number;
    height: number;
    angle: number;
    pivotX: number;
    pivotY: number;
};

// create canvas and setup pixi
const canvasWidth = 500;
const canvasHeight = 500;
const painter = new Canvas2DPainter(canvasWidth, canvasHeight, '#ccc');

document.body.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: center;
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

// update transforms before caching matrices
red.updateTransform();
green.updateTransform();
blue.updateTransform();

// calculate bounds
const bounds = sprites.getBounds();

// setup transform state
const transform = {
    matrix: new Matrix(),
    x: 0,
    y: 0,
    pivotX: 0.5,
    pivotY: 0.5,
    scaleX: 1,
    scaleY: 1,
    rotation: 15,
};

// track drag info
interface DragInfo
{
    mode: 'none' | 'rotation';
    start: {
        transformRotation: number;
        dragAngle: number;
    };
}

const dragInfo: DragInfo = {
    mode: 'none',
    start: {
        transformRotation: 0,
        dragAngle: 0,
    },
};

// create transform display objects
const graphics = new Graphics();
const container = new Container();

edit.addChild(container);
container.addChild(graphics);

graphics.clear();
graphics.lineStyle(1, 0xffffff, 1);
graphics.beginFill(0xffffff, 0.01);
graphics.drawRect(0.5, 0.5, bounds.width, bounds.height);
graphics.endFill();

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
    mouseLocal: createPoint(0x0000ff, 7),
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
const updateMatrix = (trans: Transform, origMatrix: Matrix) =>
{
    const combinedMatrix = origMatrix.clone();

    combinedMatrix.translate(-bounds.left, -bounds.top);
    combinedMatrix.prepend(transform.matrix);
    trans.setFromMatrix(combinedMatrix);
};

function calcTransform()
{
    const { matrix } = transform;
    const centerX = bounds.width * transform.pivotX;
    const centerY = bounds.height * transform.pivotY;

    setPoint('pivot', centerX, centerY);

    // reset transform matrix
    matrix.identity();

    // apply negative pivot
    matrix.translate(-centerX, -centerY);

    // scale
    matrix.scale(transform.scaleX, transform.scaleY);

    // rotate
    matrix.rotate(degToRad(transform.rotation));

    // move pivot back
    matrix.translate(centerX, centerY);

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
}

function getPivotGlobalPos()
{
    const localPoint = { x: transform.pivotX * bounds.width, y: transform.pivotY * bounds.height };
    const globalPoint = { x: 0, y: 0 };

    container.worldTransform.apply(localPoint, globalPoint);

    return globalPoint;
}

setInterval(() =>
{
    calcTransform();

    // transform.rotation += 1;
}, 100);

graphics.interactive = true;
graphics.on('mousemove', (e: InteractionEvent) =>
{
    const globalX = e.data.global.x;
    const globalY = e.data.global.y;

    const localPoint = container.worldTransform.applyInverse(e.data.global);

    localPoint.x = Math.min(bounds.width, Math.max(0, localPoint.x));
    localPoint.y = Math.min(bounds.height, Math.max(0, localPoint.y));

    const { x, y } = findNearestPointOnRect(localPoint.x, localPoint.y, 0, 0, bounds.width, bounds.height);

    setPoint('mouseLocal', localPoint.x, localPoint.y);
    setPoint('nearest', x, y);

    if (dragInfo.mode === 'rotation')
    {
        const globalPivot = getPivotGlobalPos();
        const angle = angleBetween(globalPivot.x, globalPivot.y, globalX, globalY) - dragInfo.start.dragAngle;

        transform.rotation = dragInfo.start.transformRotation + angle;
        calcTransform();
    }
}).on('mousedown', (e: InteractionEvent) =>
{
    const globalX = e.data.global.x;
    const globalY = e.data.global.y;

    const localPoint = container.worldTransform.applyInverse(e.data.global);

    localPoint.x = Math.min(bounds.width, Math.max(0, localPoint.x));
    localPoint.y = Math.min(bounds.height, Math.max(0, localPoint.y));

    setPoint('mouseLocal', localPoint.x, localPoint.y);

    if (e.data.buttons === 1)
    {
        if (e.data.originalEvent.shiftKey)
        {
            transform.pivotX = localPoint.x / bounds.width;
            transform.pivotY = localPoint.y / bounds.height;

            calcTransform();

            const newPoint = getPivotGlobalPos();
            const deltaX = newPoint.x - globalX;
            const deltaY = newPoint.y - globalY;

            transform.x += -deltaX;
            transform.y += -deltaY;

            calcTransform();
        }
        else if (e.data.originalEvent.metaKey)
        {
            const globalPivot = getPivotGlobalPos();

            dragInfo.mode = 'rotation';
            dragInfo.start.transformRotation = transform.rotation;
            dragInfo.start.dragAngle = angleBetween(globalPivot.x, globalPivot.y, globalX, globalY);
        }
    }
});

window.addEventListener('mouseup', () =>
{
    dragInfo.mode = 'none';
});
