import type { InteractionEvent } from 'pixi.js';

import type { BaseTransformGizmo } from '.';

export abstract class TransformOperation<K extends string = string>
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

    protected hasCache(key: K)
    {
        return this.cache.has(key);
    }

    protected get isCached()
    {
        return this.cache.size > 0;
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
    event: InteractionEvent;
}

export const defaultDragInfo: Omit<DragInfo, 'event'> = {
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