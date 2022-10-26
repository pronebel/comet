import type { Matrix } from 'pixi.js';
import { Rectangle } from 'pixi.js';

export type Point = { x: number; y: number };

export function radToDeg(rad: number)
{
    return rad * (180 / Math.PI);
}

export function degToRad(deg: number)
{
    return deg * (Math.PI / 180);
}

export function angleBetween(x1: number, y1: number, x2: number, y2: number)
{
    const deg = radToDeg(Math.atan2(y2 - y1, x2 - x1));

    if (deg < 0)
    {
        return 180 + (180 - Math.abs(deg));
    }

    return deg;
}

export function distanceBetween(x1: number, y1: number, x2: number, y2: number)
{
    const x = Math.abs(x2 - x1);
    const y = Math.abs(y2 - y1);

    return Math.sqrt((y * y) + (x * x));
}

export function polarPoint(deg: number, length: number, centerX = 0, centerY = 0)
{
    const rad = degToRad(deg);
    const x = centerX + (length * Math.cos(rad));
    const y = centerY + (length * Math.sin(rad));

    return { x, y };
}

export function rotatePointAround(x: number, y: number, deg: number, originX: number, originY: number)
{
    const rad = degToRad(deg);
    const sin = Math.sin(rad);
    const cos = Math.cos(rad);

    // translate point back to origin:
    const translatedX = x - originX;
    const translatedY = y - originY;

    // rotate point
    const rotatedX = (translatedX * cos) - (translatedY * sin);
    const rotatedY = (translatedX * sin) + (translatedY * cos);

    // translate point back:
    return { x: rotatedX + originX, y: rotatedY + originY };
}

export function intersectLines(
    p1x: number,
    p1y: number,
    p2x: number,
    p2y: number,
    p3x: number,
    p3y: number,
    p4x: number,
    p4y: number,
): Point | undefined
{
    const c2x = p3x - p4x; // (x3 - x4)
    const c3x = p1x - p2x; // (x1 - x2)
    const c2y = p3y - p4y; // (y3 - y4)
    const c3y = p1y - p2y; // (y1 - y2)

    // down part of intersection point formula
    const d  = (c3x * c2y) - (c3y * c2x);

    if (d === 0)
    {
        return undefined;
    }

    // upper part of intersection point formula
    const u1 = (p1x * p2y) - (p1y * p2x); // (x1 * y2 - y1 * x2)
    const u4 = (p3x * p4y) - (p3y * p4x); // (x3 * y4 - y3 * x4)

    // intersection point formula
    const px = ((u1 * c2x) - (c3x * u4)) / d;
    const py = ((u1 * c2y) - (c3y * u4)) / d;

    return { x: px, y: py };
}

export function findNearestPointOnLine(px: number, py: number, ax: number, ay: number, bx: number, by: number)
{
    const atob = { x: bx - ax, y: by - ay };
    const atop = { x: px - ax, y: py - ay };
    const len = (atob.x * atob.x) + (atob.y * atob.y);
    let dot = (atop.x * atob.x) + (atop.y * atob.y);
    const t = Math.min(1, Math.max(0, dot / len));

    dot = ((bx - ax) * (py - ay)) - ((by - ay) * (px - ax));

    return { x: ax + (atob.x * t), y: ay + (atob.y * t) };
}

export type RectSide = 'top' | 'right' | 'bottom' | 'left';

export function findNearestPointOnRect(x: number, y: number, left: number, top: number, width: number, height: number):
{side: RectSide; distance: number; x: number; y: number}
{
    const right = left + width;
    const bottom = top + height;

    // top, right, bottom, left
    const { x: topX, y: topY } = findNearestPointOnLine(x, y, left, top, right, top);
    const { x: rightX, y: rightY }  = findNearestPointOnLine(x, y, right, top, right, bottom);
    const { x: bottomX, y: bottomY }  = findNearestPointOnLine(x, y, left, bottom, right, bottom);
    const { x: leftX, y: leftY }  = findNearestPointOnLine(x, y, left, top, left, bottom);

    const topD = distanceBetween(x, y, topX, topY);
    const rightD = distanceBetween(x, y, rightX, rightY);
    const bottomD = distanceBetween(x, y, bottomX, bottomY);
    const leftD = distanceBetween(x, y, leftX, leftY);

    const points: {
        side: 'top' | 'right' | 'bottom' | 'left';
        distance: number;
        x: number;
        y: number;
    }[] = [
        { side: 'top', distance: topD, x: topX, y: topY },
        { side: 'right', distance: rightD, x: rightX, y: rightY },
        { side: 'bottom', distance: bottomD, x: bottomX, y: bottomY },
        { side: 'left', distance: leftD, x: leftX, y: leftY },
    ];

    points.sort((a, b) =>
    {
        if (a.distance < b.distance)
        {
            return -1;
        }
        if (a.distance > b.distance)
        {
            return 1;
        }

        return 0;
    });

    return points[0];
}

export type DragHVertex = 'left' | 'center' | 'right';
export type DragVVertex = 'top' | 'center' | 'bottom';

export function closestEdgeVertexOnRect(
    x: number,
    y: number,
    left: number,
    top: number,
    width: number,
    height: number,
    centerProportion: number,
): {
        h: DragHVertex;
        v: DragVVertex;
    }
{
    const near = 0.5 - centerProportion;
    const far = 0.5 + centerProportion;
    const centerLeft = left + (width * near);
    const centerRight = left + (width * far);
    const centerTop = top + (height * near);
    const centerBottom = top + (height * far);

    let h: DragHVertex = 'left';

    if (x >= centerLeft && x <= centerRight)
    {
        h = 'center';
    }
    else if (x > centerRight)
    {
        h = 'right';
    }

    let v: DragVVertex = 'top';

    if (y >= centerTop && y <= centerBottom)
    {
        v = 'center';
    }
    else if (y > centerBottom)
    {
        v = 'bottom';
    }

    return {
        h,
        v,
    };
}

export function fitRectToPoints(points: Point[])
{
    let minX = Number.MAX_VALUE;
    let minY = Number.MAX_VALUE;
    let maxX = Number.MIN_VALUE;
    let maxY = Number.MIN_VALUE;

    for (const p of points)
    {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
    }

    return new Rectangle(minX, minY, maxX - minX, maxY - minY);
}

export function getMatrixRotation(matrix: Matrix)
{
    const p0 = matrix.apply({ x: 0, y: 0 });
    const p1 = matrix.apply({ x: 10, y: 0 });
    const angle = angleBetween(p0.x, p0.y, p1.x, p1.y);

    return angle;
}
