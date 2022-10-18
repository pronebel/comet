import { angleBetween, distanceBetween } from '../../core/util/geom';

const mousePos = {
    x: 0,
    y: 0,
};

export function getWindowMouseClientPosition()
{
    return mousePos;
}

window.addEventListener('mousemove', (e: MouseEvent) =>
{
    mousePos.x = e.clientX;
    mousePos.y = e.clientY;
});

export interface DragInfo
{
    x: number;
    y: number;
    angle: number;
    distance: number;
}

export type DragHandler = (dragInfo: DragInfo, event: MouseEvent) => void;

export function drag(handler: DragHandler): Promise<DragInfo>
{
    return new Promise<DragInfo>((resolve) =>
    {
        const startClientX = mousePos.x;
        const startClientY = mousePos.y;

        const dragInfo: DragInfo = { x: 0, y: 0, angle: 0, distance: 0 };

        const updateHandlerWithDragInfo = (event: MouseEvent) =>
        {
            const clientX = mousePos.x;
            const clientY = mousePos.y;

            dragInfo.x = clientX - startClientX;
            dragInfo.y = clientY - startClientY;
            dragInfo.angle = angleBetween(startClientX, startClientY, clientX, clientY);
            dragInfo.distance = distanceBetween(startClientX, startClientY, clientX, clientY);

            handler(dragInfo, event);
        };

        const onMouseMove = (event: MouseEvent) =>
        {
            updateHandlerWithDragInfo(event);
        };

        const onMouseUp = (event: MouseEvent) =>
        {
            updateHandlerWithDragInfo(event);

            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);

            resolve(dragInfo);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    });
}
