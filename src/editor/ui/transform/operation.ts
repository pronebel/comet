import type { InteractionEvent } from 'pixi.js';

import type { TransformGizmo } from './gizmo';

export abstract class TransformOperation<K extends string = string>
{
    public cache: Map<K, number>;

    constructor(public readonly gizmo: TransformGizmo)
    {
        this.cache = new Map();
    }

    protected writeCache(key: K, value: number)
    {
        this.cache.set(key, value);
    }

    public readCache(key: K)
    {
        if (!this.cache.has(key))
        {
            throw new Error(`Transform operation does not contain cached key "${key}"`);
        }

        return this.cache.get(key) as number;
    }

    public hasCache(key: K)
    {
        return this.cache.has(key);
    }

    public get isCached()
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
