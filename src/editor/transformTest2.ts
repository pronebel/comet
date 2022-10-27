import type { InteractionEvent } from 'pixi.js';
import { Application, Container } from 'pixi.js';

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

    const gizmo = new SingleObjectTransformGizmo();

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

        node.view.interactive = true;
        node.view.on('mousedown', (e: InteractionEvent) =>
        {
            gizmo.select(node);
            gizmo.onMouseDown(e);
        });

        return node;
    }

    const red = createNode({ tint: 0xff0000, x: 100, y: 50, width: 100, height: 50, angle: 0, pivotX: 0, pivotY: 0 });
    const green = createNode({
        tint: 0x006600, x: 250, y: 100, width: 50, height: 70, angle: 15, pivotX: 0.5, pivotY: 0.25,
    });
    const blue = createNode({ tint: 0x0000ff, x: 150, y: 150, width: 50, height: 50, angle: 0, pivotX: 0, pivotY: 0 });

    return { win, editLayer, red, green, blue, gizmo, pixi };
}

const { editLayer, gizmo, pixi } = setup();

gizmo.setContainer(editLayer);

pixi.stage.interactive = true;
pixi.stage.on('mousedown', () =>
{
    gizmo.deselect();
});
