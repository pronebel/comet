let clientX = 0;
let clientY = 0;

window.addEventListener('mousemove', (e: MouseEvent) =>
{
    clientX = e.clientX;
    clientY = e.clientY;
});

export interface DragInfo
{
    x: number;
    y: number;
}

export type DragHandler = (dragInfo: DragInfo, event: MouseEvent) => void;

export function drag(handler: DragHandler): Promise<DragInfo>
{
    return new Promise<DragInfo>((resolve) =>
    {
        const startClientX = clientX;
        const startClientY = clientY;
        const dragInfo: DragInfo = { x: 0, y: 0 };

        const updateHandlerWithDragInfo = (event: MouseEvent) =>
        {
            dragInfo.x = clientX - startClientX;
            dragInfo.y = clientY - startClientY;
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
