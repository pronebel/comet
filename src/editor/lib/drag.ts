import type { Sprite } from 'pixi.js';

import type { DebugComponent } from '../../core/lib/components/debug';
import { app } from './app';

interface State
{
    component?: DebugComponent;
    startX: number;
    startY: number;
    startClientX: number;
    startClientY: number;
    clientX: number;
    clientY: number;
}

const state: State = {
    startX: 0,
    startY: 0,
    startClientX: 0,
    startClientY: 0,
    clientX: 0,
    clientY: 0,
};

window.addEventListener('mousemove', (e: MouseEvent) =>
{
    state.clientX = e.clientX;
    state.clientY = e.clientY;

    if (state.component)
    {
        const deltaX = state.clientX - state.startClientX;
        const deltaY = state.clientY - state.startClientY;

        const newX = state.startX + deltaX;
        const newY = state.startY + deltaY;

        state.component.model.x = newX;
        state.component.model.y = newY;

        const sprite = state.component.getView<Sprite>();
        const bounds = sprite.getBounds();

        app.selection.x = bounds.left;
        app.selection.y = bounds.top;
    }
});

window.addEventListener('mouseup', () =>
{
    delete state.component;
});

export function startDrag(component: DebugComponent)
{
    state.startX = component.model.getValue<number>('x');
    state.startY = component.model.getValue<number>('y');
    state.startClientX = state.clientX;
    state.startClientY = state.clientY;
    state.component = component;
}
