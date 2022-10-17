import { Application as PixiApplication } from 'pixi.js';

import type { ContainerNode } from '../../core/nodes/concrete/container';
import { NodeSelection } from './selection';

export class EditableView
{
    public rootNode: ContainerNode;
    public canvas: HTMLCanvasElement;
    public pixi: PixiApplication;
    public selection: NodeSelection;

    constructor(rootNode: ContainerNode)
    {
        this.selection = new NodeSelection();
        this.rootNode = rootNode;

        const canvas = this.canvas = document.createElement('canvas');

        const pixi = this.pixi = new PixiApplication({
            view: canvas,
            backgroundColor: 0x111111,
        });

        pixi.stage.addChild(rootNode.view);
    }

    public setContainer(container: HTMLDivElement)
    {
        this.pixi.resizeTo = container;
        container.appendChild(this.canvas);
    }
}
