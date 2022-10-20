import type { Transform } from 'pixi.js';
import { Application, Container, Graphics, Matrix, Sprite, Texture } from 'pixi.js';

import { degToRad } from '../core/util/geom';
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
pixi.stage.addChild(edit);
pixi.stage.addChild(sprites);

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
const green = createSprite(0x00ff00, spriteConfig.green);
const blue = createSprite(0x0000ff, spriteConfig.blue);

// update transforms before caching matrices
red.updateTransform();
green.updateTransform();
blue.updateTransform();

// calculate bounds
const bounds = sprites.getBounds();

// setup transform state
const transform = {
    pivotX: 0.5,
    pivotY: 0.5,
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
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

// setup transform operation
const transformMatrix = new Matrix();

// cache matrices
const matrixCache = {
    red: red.worldTransform.clone(),
    green: green.worldTransform.clone(),
    blue: blue.worldTransform.clone(),
};

// run transform operation
const updateMatrix = (transform: Transform, origMatrix: Matrix) =>
{
    const combinedMatrix = origMatrix.clone();

    combinedMatrix.translate(-bounds.left, -bounds.top);
    combinedMatrix.prepend(transformMatrix);
    transform.setFromMatrix(combinedMatrix);
};

setInterval(() =>
{
    const centerX = bounds.width * transform.pivotX;
    const centerY = bounds.height * transform.pivotY;

    // reset transform matrix
    transformMatrix.identity();

    // apply negative pivot
    transformMatrix.translate(-centerX, -centerY);

    // scale
    transformMatrix.scale(transform.scaleX, transform.scaleY);

    // rotate
    transformMatrix.rotate(degToRad(transform.rotation));

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

    transform.rotation += 1;
}, 100);

// graphics.interactive = true;
// graphics.on('mousemove', (e: InteractionEvent) =>
// {
//     const localPoint = graphics.worldTransform.applyInverse(e.data.global);
// });
