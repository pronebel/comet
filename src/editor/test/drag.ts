import type { ContainerNode } from '../../core/nodes/concrete/container';
import { ModifyModelCommand } from '../commands/modifyModel';
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
    newX: number;
    newY: number;
}

const state: State = {
    startX: 0,
    startY: 0,
    startClientX: 0,
    startClientY: 0,
    clientX: 0,
    clientY: 0,
    newX: 0,
    newY: 0,
};

window.addEventListener('mousemove', (e: MouseEvent) =>
{
    state.clientX = e.clientX;
    state.clientY = e.clientY;

    if (state.component)
    {
        const deltaX = state.clientX - state.startClientX;
        const deltaY = state.clientY - state.startClientY;

        const newX = state.newX = state.startX + deltaX;
        const newY = state.newY = state.startY + deltaY;

        state.component.model.x = newX;
        state.component.model.y = newY;

        const app = TestApp.getInstance();

        app.fitSelection(app.selected);
    }
});

window.addEventListener('mouseup', () =>
{
    if (state.component)
    {
        if (((state.newX !== state.startX) || (state.newY !== state.startY)))
        {
            const app: TestApp = TestApp.getInstance();

            const nodeId = state.component.id;

            const command = new ModifyModelCommand({ nodeId, values: {
                x: state.newX,
                y: state.newY,
            } });

            app.execUndoRoot(command);
            command.cache.prevValues = { x: state.startX, y: state.startY };
        }

        delete state.component;
    }
});

export function startDrag(component: AnyContainer)
{
    state.startX = component.model.getValue('x');
    state.startY = component.model.getValue('y');
    state.startClientX = state.clientX;
    state.startClientY = state.clientY;
    state.newX = state.startX;
    state.newY = state.startY;
    state.component = component;
}
