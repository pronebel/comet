import { Application, Container, Sprite, Texture } from 'pixi.js';

import { SpriteNode } from '../core/nodes/concrete/sprite';
import Canvas2DPainter from './ui/2dPainter';
import Grid from './ui/grid';
import { SingleObjectTransformGizmo } from './ui/transform/single';

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
    const canvasWidth = 350;
    const canvasHeight = 350;
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

    pixi.stage.addChild(Grid.createTilingSprite(screen.availWidth, screen.availHeight));
    pixi.stage.addChild(nodesLayer);
    pixi.stage.addChild(editLayer);

    function createSprite(config: SpriteConfig, applyConfig = false)
    {
        const view = new Sprite(Texture.WHITE);

        view.tint = config.tint;

        if (applyConfig)
        {
            view.width = config.width;
            view.height = config.height;
            view.x = config.x;
            view.y = config.y;
            view.angle = config.angle;
            view.pivot.x = config.pivotX;
            view.pivot.y = config.pivotY;
        }

        // pivot is relative to local bounds
        view.getLocalBounds();

        return view;
    }

    function createNode(config: SpriteConfig)
    {
        const scaleX = config.width / 16;
        const scaleY = config.height / 16;

        const node = new SpriteNode({
            model: {
                tint: config.tint,
                x: config.x,
                y: config.y,
                scaleX,
                scaleY,
                pivotX: config.pivotX,
                pivotY: config.pivotY,
                angle: config.angle,
            },
        });

        nodesLayer.addChild(node.view);

        return node;
    }

    // const red = createNode({ tint: 0xff0000, x: 100, y: 50, width: 100, height: 50, angle: 0, pivotX: 0, pivotY: 0 });
    const green = createNode({ tint: 0x006600, x: 100, y: 100, width: 50, height: 70, angle: 15, pivotX: 0.5, pivotY: 0.25 });
    // const blue = createNode({ tint: 0x0000ff, x: 150, y: 150, width: 50, height: 50, angle: 0, pivotX: 0, pivotY: 0 });

    // const size = 32;
    // const test = createSprite({
    //     tint: 0xffff00,
    //     x: 50,
    //     y: 50,
    //     width: size,
    //     height: size,
    //     angle: 0,
    //     pivotX: 8, // 16 * 0.5
    //     pivotY: 8,
    // }, true);

    // nodesLayer.addChild(test);

    // setParent(child, red.view);
    // const child1 = createSprite({ tint: 0xffffff, x: 10, y: 10, width: 10, height: 10, angle: 0, pivotX: 0, pivotY: 0 });
    // const child2 = createSprite({ tint: 0xcccccc, x: 10, y: 10, width: 10, height: 10, angle: 0, pivotX: 0, pivotY: 0 });

    // blue.view.addChild(child1);
    // child1.addChild(child2);

    return { win, editLayer, green };
}

const { win, editLayer, green } = setup();

const gizmo = new SingleObjectTransformGizmo();

gizmo.setContainer(editLayer);
gizmo.select(green);

win.test = gizmo;

// gizmo.setSize(50, 50);
// gizmo.x = 100;
// gizmo.y = 100;
// gizmo.pivotX = 0;
// gizmo.pivotY = 0;
// gizmo.rotation = 30;
// gizmo.scaleX = 2;
// gizmo.setPivot(1, 1);

// setInterval(() =>
// {
//     frame.rotation += 1;
// }, 50);
