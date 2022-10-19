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
    let deg = radToDeg(Math.atan2(y2 - y1, x2 - x1));

    if (deg < 0)
    {
        deg = 180 + (180 - Math.abs(deg));
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

(window as any).rotatePointAround = rotatePointAround;
