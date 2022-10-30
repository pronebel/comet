import type { DisplayObject } from 'pixi.js';
import { Matrix, Rectangle, Transform } from 'pixi.js';

import type { ContainerNode } from '../../../core/nodes/concrete/container';
import type { Point } from '../../../core/util/geom';
import { angleBetween, degToRad } from '../../../core/util/geom';

export function round(num: number)
{
    return Math.round((num + Number.EPSILON) * 1000) / 1000;
}

export function updateTransforms(view: DisplayObject)
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

export interface InitialGizmoTransform
{
    pivotX: number;
    pivotY: number;
    x: number;
    y: number;
    rotation: number;
    naturalWidth: number;
    naturalHeight: number;
    width: number;
    height: number;
    scaleX: number;
    scaleY: number;
    matrix: Matrix;
}

export const defaultInitialGizmoTransform: InitialGizmoTransform = {
    pivotX: 0,
    pivotY: 0,
    x: 0,
    y: 0,
    rotation: 0,
    naturalWidth: 0,
    naturalHeight: 0,
    width: 0,
    height: 0,
    scaleX: 1,
    scaleY: 1,
    matrix: Matrix.IDENTITY,
};

export function getGizmoInitialTransformFromView(node: ContainerNode): InitialGizmoTransform
{
    const view = node.view;
    const { worldTransform } = view;

    updateTransforms(view);

    const matrix = worldTransform.clone();

    const localBounds = view.getLocalBounds();

    const width = localBounds.width;
    const height = localBounds.height;

    const p1 = matrix.apply({ x: 0, y: 0 });
    const p2 = matrix.apply({ x: width, y: 0 });

    const p0 = matrix.apply({ x: view.pivot.x, y: view.pivot.y });

    const rotation = angleBetween(p1.x, p1.y, p2.x, p2.y);
    const x = p0.x;
    const y = p0.y;
    const pivotX = view.pivot.x;
    const pivotY = view.pivot.y;
    const scaleX = view.scale.x;
    const scaleY = view.scale.y;
    const naturalWidth = node.naturalWidth;
    const naturalHeight = node.naturalHeight;

    const transform = new Transform();

    transform.scale.x = scaleX;
    transform.scale.y = scaleY;
    transform.rotation = degToRad(rotation);
    transform.pivot.x = pivotX;
    transform.pivot.y = pivotY;
    transform.position.x = x;
    transform.position.y = y;

    transform.updateLocalTransform();

    return {
        matrix: transform.localTransform,
        naturalWidth,
        naturalHeight,
        width,
        height,
        rotation,
        x,
        y,
        pivotX,
        pivotY,
        scaleX,
        scaleY,
    };
}

export function getLocalTransform(view: DisplayObject)
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

    return viewMatrix;
}

export function getTotalGlobalBounds<T extends ContainerNode>(nodes: T[])
{
    let rect = new Rectangle();

    nodes.forEach((node) =>
    {
        node.view.updateTransform();

        const bounds = node.getGlobalBounds();

        if (rect.width === 0 && rect.height === 0 && rect.x === 0 && rect.y === 0)
        {
            rect = bounds.clone();
        }
        else
        {
            rect.enlarge(bounds);
        }
    });

    return rect;
}
