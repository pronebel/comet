import type { Matrix } from 'pixi.js';
import { type DisplayObject } from 'pixi.js';
import { Application, Container, Graphics, Rectangle, Sprite, Texture, Transform } from 'pixi.js';

import { type Point, radToDeg } from '../core/util/geom';
import { angleBetween, degToRad } from '../core/util/geom';
import Canvas2DPainter from './ui/2dPainter';
import Grid from './ui/grid';
import { decomposeTransform } from './ui/transform/util';

function setup()
{
    type SpriteConfig = {
        tint: number;
        x: number;
        y: number;
        width: number;
        height: number;
        angle: number;
        pivotX: number;
        pivotY: number;
    };

    const win = window as any;
    const canvasWidth = 200;
    const canvasHeight = 200;
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

    const nodesLayer = new Container();
    const editLayer = new Container();
    const container = new Container();

    pixi.stage.addChild(Grid.createTilingSprite(screen.availWidth, screen.availHeight));
    pixi.stage.addChild(nodesLayer);
    pixi.stage.addChild(editLayer);

    nodesLayer.addChild(container);

    function createSprite(config: Partial<SpriteConfig>)
    {
        const view = new Sprite(Texture.WHITE);

        view.tint = config.tint ?? 0xffffff;
        view.width = config.width ?? 16;
        view.height = config.height ?? 16;
        view.x = config.x ?? 10;
        view.y = config.y ?? 10;
        view.angle = config.angle ?? 0;
        view.pivot.x = config.pivotX ?? 0;
        view.pivot.y = config.pivotY ?? 0;
        view.alpha = 1;

        return view;
    }

    const red = createSprite({ tint: 0xff0000, x: 50, y: 50, angle: 0, width: 64 });
    const green = createSprite({ tint: 0x006600, x: 10, y: 10, angle: 20 });
    const blue = createSprite({ tint: 0x0000ff, x: 10, y: 10, angle: 0 });

    const white = createSprite({ tint: 0x999999, x: 0, y: 0 });

    white.alpha = 0.5;

    nodesLayer.addChild(white);

    const selection = new Graphics();

    editLayer.addChild(selection);

    return { win, editLayer, red, green, blue, pixi, selection, white, container };
}

const { red, green, blue, selection, white, container, win } = setup();

container.addChild(red);
red.addChild(green);
green.addChild(blue);

function drawBorder(matrix: Matrix, width: number, height: number)
{
    const p1 = matrix.apply({ x: 0, y: 0 });
    const p2 = matrix.apply({ x: width, y: 0 });
    const p3 = matrix.apply({ x: width, y: height });
    const p4 = matrix.apply({ x: 0, y: height });

    const path = [p1.x, p1.y, p2.x, p2.y, p3.x, p3.y, p4.x, p4.y];

    selection.beginFill(0xffffff, 0.3);
    selection.drawPolygon(path);
    selection.endFill();

    selection.lineStyle(2, 0x00ffff, 1);
    selection.moveTo(p1.x, p1.y); selection.lineTo(p2.x, p2.y);
    selection.moveTo(p2.x, p2.y); selection.lineTo(p3.x, p3.y);
    selection.moveTo(p3.x, p3.y); selection.lineTo(p4.x, p4.y);
    selection.moveTo(p4.x, p4.y); selection.lineTo(p1.x, p1.y);

    // selection.beginFill(0xffff00, 1);
    // selection.drawCircle(p0.x, p0.y, 3);
    // selection.endFill();
}

// container.angle = -15;
// container.scale.set(2, 1);

container.updateTransform();
red.updateTransform();
green.updateTransform();
blue.updateTransform();

win.red = red;
win.green = green;
win.blue = blue;

win.drawBorder = (view: Sprite) =>
{
    drawBorder(view.worldTransform, view.texture.width, view.texture.height);
};

win.decomposeTransform = (view: Sprite) =>
{
    const transform = new Transform();

    decomposeTransform(transform, view.worldTransform, undefined, view.pivot);

    console.log({
        x: transform.position.x,
        y: transform.position.y,
        angle: radToDeg(transform.rotation),
        scaleX: transform.scale.x,
        scaleY: transform.scale.y,
        skewX: transform.skew.x,
        skewY: transform.skew.y,
    });

    white.transform.setFromMatrix(view.worldTransform);
};
