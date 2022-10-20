import type { InteractionEvent, Transform } from 'pixi.js';
import { Application, Container, Graphics, Matrix, Sprite, Texture } from 'pixi.js';

import { degToRad } from '../core/util/geom';
import Canvas2DPainter from './ui/2dPainter';
import Grid from './ui/grid';

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
pixi.stage.addChild(edit);
pixi.stage.addChild(sprites);

function createSprite(tint: number, x: number, y: number, width: number, height: number, addToStage = true)
{
    const sprite = new Sprite(Texture.WHITE);

    sprite.tint = tint;
    // sprite.pivot.x = width * 0.5;
    // sprite.pivot.y = height * 0.5;
    sprite.width = width;
    sprite.height = height;
    sprite.x = x;
    sprite.y = y;

    if (addToStage)
    {
        sprites.addChild(sprite);
        sprite.updateTransform();
    }

    return sprite;
}

// create 3 sprites and setup properties
const red = createSprite(0xff0000, 100, 50, 100, 50);
const green = createSprite(0x00ff00, 250, 50, 50, 100);
const blue = createSprite(0x0000ff, 150, 150, 50, 50);

green.angle = 45;

// update transforms before caching matrix
red.updateTransform();
green.updateTransform();
blue.updateTransform();

// create basic transform gizmo
const pivotH = 0.5;
const pivotV = 0.5;
const bounds = sprites.getBounds();
const centerX = bounds.width * pivotH;
const centerY = bounds.height * pivotV;

const graphics = new Graphics();
const container = new Container();
const bg = createSprite(0x333333, 0, 0, bounds.width, bounds.height, false);

edit.addChild(container);
container.addChild(bg);
container.addChild(graphics);

graphics.clear();
graphics.lineStyle(1, 0xffffff, 1);
graphics.beginFill(0xffffff, 0.01);
graphics.drawRect(0.5, 0.5, bounds.width, bounds.height);
graphics.endFill();

// graphics.interactive = true;
// graphics.on('mousemove', (e: InteractionEvent) =>
// {
//     const localPoint = graphics.worldTransform.applyInverse(e.data.global);
// });

// setup transform operation
const state = {
    deg: 15,
};
const transformMatrix = new Matrix();

// cache matrix and run transform operation
const matrixCache = {
    red: red.worldTransform.clone(),
    green: green.worldTransform.clone(),
    blue: blue.worldTransform.clone(),
};

const updateMatrix = (transform: Transform, origMatrix: Matrix) =>
{
    const combinedMatrix = origMatrix.clone();

    combinedMatrix.translate(-bounds.left, -bounds.top);
    combinedMatrix.prepend(transformMatrix);
    transform.setFromMatrix(combinedMatrix);
};

setInterval(() =>
{
    // reset transform matrix
    transformMatrix.identity();

    // apply negative pivot
    transformMatrix.translate(-centerX, -centerY);

    // rotate
    transformMatrix.rotate(degToRad(state.deg));

    // move pivot back
    transformMatrix.translate(centerX, centerY);

    // translate to transform bounds position
    transformMatrix.translate(bounds.left, bounds.top);

    // update transform container with matrix
    container.transform.setFromMatrix(transformMatrix);
    container.updateTransform();

    // update sprites with transform matrix
    updateMatrix(red.transform, matrixCache.red);
    updateMatrix(green.transform, matrixCache.green);
    updateMatrix(blue.transform, matrixCache.blue);

    // state.deg += 1;
}, 100);
