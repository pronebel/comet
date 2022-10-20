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
): {x: number; y: number} | undefined
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

export function findNearestPointOnRect(px: number, py: number, x: number, y: number, width: number, height: number)
{
    const left = x;
    const right = x + width;
    const top = y;
    const bottom = top + height;

    // top, right, bottom, left
    const { x: topX, y: topY } = findNearestPointOnLine(px, py, left, top, right, top);
    const { x: rightX, y: rightY }  = findNearestPointOnLine(px, py, right, top, right, bottom);
    const { x: bottomX, y: bottomY }  = findNearestPointOnLine(px, py, left, bottom, right, bottom);
    const { x: leftX, y: leftY }  = findNearestPointOnLine(px, py, left, top, left, bottom);

    const topD = distanceBetween(px, py, topX, topY);
    const rightD = distanceBetween(px, py, rightX, rightY);
    const bottomD = distanceBetween(px, py, bottomX, bottomY);
    const leftD = distanceBetween(px, py, leftX, leftY);

    const points: {
        side: 'top' | 'right' | 'bottom' | 'left';
        d: number;
        x: number;
        y: number;
    }[] = [
        { side: 'top', d: topD, x: topX, y: topY },
        { side: 'right', d: rightD, x: rightX, y: rightY },
        { side: 'bottom', d: bottomD, x: bottomX, y: bottomY },
        { side: 'left', d: leftD, x: leftX, y: leftY },
    ];

    points.sort((a, b) =>
    {
        if (a.d < b.d)
        {
            return -1;
        }
        if (a.d > b.d)
        {
            return 1;
        }

        return 0;
    });

    return points[0];
}
