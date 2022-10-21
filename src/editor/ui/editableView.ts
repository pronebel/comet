import { Application as PixiApplication, Container } from 'pixi.js';

import type { ContainerNode } from '../../core/nodes/concrete/container';
import Grid from './grid';
import { NodeSelection } from './selection';
import { TransformGizmo } from './transformGizmo';

export class EditableView
{
    public rootNode: ContainerNode;
    public canvas: HTMLCanvasElement;
    public pixi: PixiApplication;
    public selection: NodeSelection;
    public transformGizmo: TransformGizmo;
    public gridLayer: Container;
    public nodeLayer: Container;
    public editLayer: Container;

    constructor(rootNode: ContainerNode)
    {
        this.rootNode = rootNode;
        this.selection = new NodeSelection();
        this.transformGizmo = new TransformGizmo();

        const canvas = this.canvas = document.createElement('canvas');

        const pixi = this.pixi = new PixiApplication({
            view: canvas,
            backgroundColor: 0x111111,
        });

        const gridLayer = this.gridLayer = new Container();
        const nodeLayer = this.nodeLayer = new Container();
        const editLayer = this.editLayer = new Container();

        pixi.stage.addChild(gridLayer);
        pixi.stage.addChild(nodeLayer);
        pixi.stage.addChild(editLayer);

        gridLayer.addChild(Grid.createTilingSprite(screen.availWidth, screen.availHeight));
        nodeLayer.addChild(rootNode.view);
        editLayer.addChild(this.transformGizmo);

        this.selection
            .on('add', this.onAddSelection)
            .on('remove', this.onRemoveSelection);
    }

    public setContainer(container: HTMLDivElement)
    {
        this.pixi.resizeTo = container;
        container.appendChild(this.canvas);
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected onAddSelection = (node: ContainerNode) =>
    {
        //
    };

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected onRemoveSelection = (node: ContainerNode) =>
    {
        //
    };
}