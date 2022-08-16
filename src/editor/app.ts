import { Application } from 'pixi.js';

export let app: Application;

export function createApp(canvas: HTMLCanvasElement)
{
    app = new Application({
        view: canvas,
        resizeTo: canvas,
        backgroundColor: 0x333333,
    });
}
