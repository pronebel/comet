import { Application, Container,  Sprite, Texture } from 'pixi.js';

import { ContainerNode } from '../core/nodes/concrete/container';
import Canvas2DPainter from './ui/2dPainter';
import Grid from './ui/grid';
import { NodeSelection } from './ui/selection';
import { TransformGizmo } from './ui/transform/gizmo';

type SpriteConfig = {
    x: number;
    y: number;
    width: number;
    height: number;
    angle: number;
    pivotX: number;
    pivotY: number;
};

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

function createNode(tint: number, config: SpriteConfig)
{
    const view = new Sprite(Texture.WHITE);

    view.tint = tint;
    view.width = config.width;
    view.height = config.height;
    view.x = config.x;
    view.y = config.y;
    view.angle = config.angle;
    view.pivot.x = config.pivotX;
    view.pivot.y = config.pivotY;

    const node = new ContainerNode();

    node.view = view;
    nodesLayer.addChild(view);

    return node;
}

const spriteConfig: Record<string, SpriteConfig> = {
    red: { x: 100, y: 50, width: 100, height: 50, angle: 0, pivotX: 0, pivotY: 0 },
    green: { x: 250, y: 50, width: 50, height: 100, angle: 45, pivotX: 0, pivotY: 0 },
    blue: { x: 150, y: 150, width: 50, height: 50, angle: 0, pivotX: 0, pivotY: 0 },
};

const red = createNode(0xff0000, spriteConfig.red);
const green = createNode(0x009900, spriteConfig.green);
const blue = createNode(0x0000ff, spriteConfig.blue);

const selection = new NodeSelection();
const gizmo = new TransformGizmo(selection);

editLayer.addChild(gizmo.container);

selection.add(red);

setTimeout(() =>
{
    // gizmo.setState({ rotation: 15 });
    selection.add(green);
}, 100);

setTimeout(() =>
{
    // gizmo.state.rotation = 25;
    selection.add(blue);
}, 200);

// setTimeout(() =>
// {
//     // gizmo.state.rotation = 35;
//     selection.remove(green);
// }, 300);

(window as any).gizmo = gizmo;
