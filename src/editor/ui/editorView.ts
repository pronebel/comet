import { Application as PixiApplication } from 'pixi.js';

import { NodeSelection } from './selection';

export class EditorView
{
    public id: string;
    public canvas: HTMLCanvasElement;
    public pixiApp: PixiApplication;
    public selection: NodeSelection;

    constructor(id: string)
    {
        this.id = id;
        this.selection = new NodeSelection();
        const canvas = this.canvas = new HTMLCanvasElement();

        this.pixiApp = new PixiApplication({
            view: canvas,
            resizeTo: canvas,
            backgroundColor: 0x333333,
        });
    }

    public reset()
    {

    }
}
