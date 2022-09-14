import type { ContainerNode } from '../../../core/lib/node/types/container';
import { TestApp } from './testApp';

type AnyContainer = ContainerNode<any, any>;

interface State
{
    component?: AnyContainer;
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

        TestApp.getInstance().fitSelection(state.component);
    }
});

window.addEventListener('mouseup', () =>
{
    delete state.component;
});

export function startDrag(component: AnyContainer)
{
    state.startX = component.model.getValue('x');
    state.startY = component.model.getValue('y');
    state.startClientX = state.clientX;
    state.startClientY = state.clientY;
    state.component = component;
}