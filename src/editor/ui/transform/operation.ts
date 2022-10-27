import type { BaseTransformGizmo } from '.';

export abstract class TransformOperation<K extends string>
{
    public cache: Map<K, number>;

    constructor(public readonly gizmo: BaseTransformGizmo)
    {
        this.cache = new Map();
    }

    protected writeCache(key: K, value: number)
    {
        this.cache.set(key, value);
    }

    protected readCache(key: K)
    {
        if (!this.cache.has(key))
        {
            throw new Error(`Transform operation does not contain cached key "${key}"`);
        }

        return this.cache.get(key) as number;
    }

    public abstract init(dragInfo: DragInfo): void;

    public abstract drag(dragInfo: DragInfo): void;

    public abstract end(dragInfo: DragInfo): void;
}

export interface DragInfo
{
    globalX: number;
    globalY: number;
    localX: number;
    localY: number;
    isShiftDown: boolean;
    isAltDown: boolean;
    isControlDown: boolean;
    isMetaDown: boolean;
    buttons: number;
}

export const defaultDragInfo: DragInfo = {
    globalX: 0,
    globalY: 0,
    localX: 0,
    localY: 0,
    isShiftDown: false,
    isAltDown: false,
    isControlDown: false,
    isMetaDown: false,
    buttons: 0,
};
