import { Application as PixiApplication } from 'pixi.js';

import type { ContainerNode } from '../../core/nodes/concrete/container';
import { NodeSelection } from './selection';

export class EditorView
{
    public id: string;
    public rootNode: ContainerNode;
    public canvas: HTMLCanvasElement;
    public pixiApp: PixiApplication;
    public selection: NodeSelection;

    constructor(id: string, rootNode: ContainerNode)
    {
        this.id = id;
        this.selection = new NodeSelection();
        this.rootNode = rootNode;

        const canvas = this.canvas = new HTMLCanvasElement();

        this.pixiApp = new PixiApplication({
            view: canvas,
            resizeTo: canvas,
            backgroundColor: 0x333333,
        });
    }

    public setRootNode(node: ContainerNode)
    {
        this.rootNode = node;
    }

    public reset()
    {
        //
    }
}
