import { Application, Container,  Sprite, Texture } from 'pixi.js';

import { ContainerNode } from '../core/nodes/concrete/container';
import Canvas2DPainter from './ui/2dPainter';
import Grid from './ui/grid';
import { NodeSelection } from './ui/selection';
import { TransformGizmo } from './ui/transform/gizmo';

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

const nodesLayer = new Container();
const editLayer = new Container();

pixi.stage.addChild(Grid.createTilingSprite(screen.availWidth, screen.availHeight));
pixi.stage.addChild(nodesLayer);
pixi.stage.addChild(editLayer);

function createSprite(config: SpriteConfig)
{
    const view = new Sprite(Texture.WHITE);

    view.tint = config.tint;
    view.width = config.width;
    view.height = config.height;
    view.x = config.x;
    view.y = config.y;
    view.angle = config.angle;
    view.pivot.x = config.pivotX;
    view.pivot.y = config.pivotY;

    return view;
}

function createNode(config: SpriteConfig)
{
    const view = createSprite(config);

    const node = new ContainerNode();

    node.view = view;
    nodesLayer.addChild(view);

    return node;
}

const red = createNode({ tint: 0xff0000, x: 100, y: 50, width: 100, height: 50, angle: 0, pivotX: 0, pivotY: 0 });
const green = createNode({ tint: 0x00ff00, x: 250, y: 50, width: 50, height: 100, angle: 45, pivotX: 0, pivotY: 0 });
const blue = createNode({ tint: 0x0000ff, x: 150, y: 150, width: 50, height: 50, angle: 0, pivotX: 0, pivotY: 0 });

// setParent(child, red.view);
const child1 = createSprite({ tint: 0xffffff, x: 10, y: 10, width: 10, height: 10, angle: 0, pivotX: 0, pivotY: 0 });
const child2 = createSprite({ tint: 0xcccccc, x: 10, y: 10, width: 10, height: 10, angle: 0, pivotX: 0, pivotY: 0 });

blue.view.addChild(child1);
child1.addChild(child2);

const selection = new NodeSelection();
const gizmo = new TransformGizmo(selection);

window.addEventListener('keyup', (e: KeyboardEvent) =>
{
    if (e.key === ' ')
    {
        if (!selection.isEmpty)
        {
            selection.deselect();
        }
        else
        {
            selection.add(red);
            selection.add(green);
            selection.add(blue);
        }
    }
});

editLayer.addChild(gizmo.container);

selection.add(red);
selection.add(green);
selection.add(blue);

win.gizmo = gizmo;
win.red = red;
win.green = green;
win.blue = blue;
