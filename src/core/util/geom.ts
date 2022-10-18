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

(window as any).polarPoint = polarPoint;

// POINT rotate_point(float cx,float cy,float angle,POINT p)
// {
//   float s = sin(angle);
//   float c = cos(angle);

//   // translate point back to origin:
//   p.x -= cx;
//   p.y -= cy;

//   // rotate point
//   float xnew = p.x * c - p.y * s;
//   float ynew = p.x * s + p.y * c;

//   // translate point back:
//   p.x = xnew + cx;
//   p.y = ynew + cy;
//   return p;
// }
