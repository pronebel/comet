import type { DisplayObject, Matrix } from 'pixi.js';
import { Application, Container, Graphics, Rectangle, Sprite, Texture, Transform } from 'pixi.js';

import type { Point } from '../core/util/geom';
import { angleBetween, degToRad } from '../core/util/geom';
import Canvas2DPainter from './ui/2dPainter';
import Grid from './ui/grid';

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

    pixi.stage.addChild(Grid.createTilingSprite(screen.availWidth, screen.availHeight));
    pixi.stage.addChild(nodesLayer);
    pixi.stage.addChild(editLayer);

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

        nodesLayer.addChild(view);

        return view;
    }

    const red = createSprite({ tint: 0xff0000, x: 50, y: 50, angle: 20, pivotX: 8, pivotY: 8 });
    const green = createSprite({ tint: 0x006600, x: 10, y: 10, angle: 20 });
    const blue = createSprite({ tint: 0x0000ff, x: 10, y: 10, angle: 45, width: 64, height: 8, pivotY: 8 });

    const white = createSprite({ tint: 0xffff00, x: 0, y: 0 });

    const selection = new Graphics();

    editLayer.addChild(selection);

    return { win, editLayer, red, green, blue, pixi, selection, white };
}

const { red, green, blue, selection, white } = setup();

red.addChild(green);
green.addChild(blue);

const round = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

function updateTransforms(view: DisplayObject)
{
    const views: DisplayObject[] = [view];
    let ref = view;

    while (ref.parent)
    {
        views.push(ref);
        ref = ref.parent;
    }

    views.reverse();

    for (const obj of views)
    {
        obj.updateTransform();
    }
}

function getGizmoInitialTransformFromView(view: DisplayObject): InitialGizmoTransform
{
    const { worldTransform } = view;

    updateTransforms(view);

    const matrix = worldTransform.clone();

    const localBounds = view.getLocalBounds();

    const width = round(localBounds.width);
    const height = round(localBounds.height);

    const p1 = matrix.apply({ x: 0, y: 0 });
    const p2 = matrix.apply({ x: width, y: 0 });

    const p0 = matrix.apply({ x: view.pivot.x, y: view.pivot.y });

    const rotation = round(angleBetween(p1.x, p1.y, p2.x, p2.y));
    const x = round(p0.x);
    const y = round(p0.y);
    const pivotX = view.pivot.x;
    const pivotY = view.pivot.y;

    const transform = new Transform();

    transform.scale.x = view.scale.x;
    transform.scale.y = view.scale.y;
    transform.rotation = degToRad(rotation);
    transform.pivot.x = pivotX;
    transform.pivot.y = pivotY;
    transform.position.x = x;
    transform.position.y = y;

    transform.updateLocalTransform();

    return {
        matrix: transform.localTransform,
        width,
        height,
        rotation,
        x,
        y,
        pivotX,
        pivotY,
    };
}

function getGizmoInitialTransformFromViews(views: DisplayObject[])
{
    let rect: Rectangle = new Rectangle();

    views.forEach((view, i) =>
    {
        if (i === 0)
        {
            rect = view.getBounds().clone();
        }
        else
        {
            rect.enlarge(view.getBounds());
        }
    });

    const transform = new Transform();

    transform.position.x = rect.left;
    transform.position.y = rect.top;

    transform.updateLocalTransform();

    return {
        matrix: transform.localTransform,
        width: rect.width,
        height: rect.height,
        rotation: 0,
        x: rect.left,
        y: rect.top,
        pivotX: rect.width * 0.5,
        pivotY: rect.height * 0.5,
    };
}

interface InitialGizmoTransform
{
    pivotX: number;
    pivotY: number;
    x: number;
    y: number;
    rotation: number;
    width: number;
    height: number;
    matrix: Matrix;
}

function drawBounds(transform: InitialGizmoTransform)
{
    const { matrix, pivotX, pivotY, width, height } = transform;

    const p1 = matrix.apply({ x: 0, y: 0 });
    const p2 = matrix.apply({ x: width, y: 0 });
    const p3 = matrix.apply({ x: width, y: height });
    const p4 = matrix.apply({ x: 0, y: height });

    const p0 = matrix.apply({ x: pivotX, y: pivotY });

    const path = [p1.x, p1.y, p2.x, p2.y, p3.x, p3.y, p4.x, p4.y];

    selection.beginFill(0xffffff, 0.3);
    selection.drawPolygon(path);
    selection.endFill();

    selection.lineStyle(1, 0xffffff, 1);
    selection.moveTo(p1.x, p1.y); selection.lineTo(p2.x, p2.y);
    selection.moveTo(p2.x, p2.y); selection.lineTo(p3.x, p3.y);
    selection.moveTo(p3.x, p3.y); selection.lineTo(p4.x, p4.y);
    selection.moveTo(p4.x, p4.y); selection.lineTo(p1.x, p1.y);

    selection.beginFill(0xffff00, 1);
    selection.drawCircle(p0.x, p0.y, 3);
    selection.endFill();
}

function getLocalTransform(view: DisplayObject, pivot?: Point)
{
    updateTransforms(view);

    const parentMatrix = view.parent.worldTransform.clone();
    const viewMatrix = view.worldTransform.clone();
    const transform = new Transform();

    const p1 = viewMatrix.apply({ x: 0, y: 0 });
    const p2 = viewMatrix.apply({ x: view.pivot.x, y: view.pivot.y });

    parentMatrix.invert();
    viewMatrix.prepend(parentMatrix);

    transform.setFromMatrix(viewMatrix);
    transform.updateLocalTransform();

    const deltaX = p2.x - p1.x;
    const deltaY = p2.y - p1.y;

    viewMatrix.translate(deltaX, deltaY);
    white.transform.setFromMatrix(viewMatrix);

    white.pivot.x = pivot ? pivot.x : view.pivot.x;
    white.pivot.y = pivot ? pivot.y : view.pivot.y;

    console.log(deltaX, deltaY);
}

const view = blue;

// const transform = getGizmoInitialTransformFromView(view);
const transform = getGizmoInitialTransformFromViews([red, green, blue]);

drawBounds(transform);

console.log(JSON.stringify(transform, null, 4));

const localTransform = getLocalTransform(view);

/**
 - need to be given any view and get global transform values for setting gizmo initial transform
 - need to be given any view and get local transform values for setting node mode

 - gizmo frame and transform matrix are separate things
    - you need the initial transform matrix to set frame
    - you also need the actual transformation matrix which starts out at identity

 - interacting with the gizmo creates deltas from identity matrix, apply that delta matrix to views in selection and initial transform matrix
 - when ready to update model find local transform from each view and give to model

 - Matrices required:
    - Initial transform for gizmo - either calculated from view (single) or from AABB bounds (multi)
    - Main gizmo transform - deltas caused from total interactions, starts at Identity
 */
