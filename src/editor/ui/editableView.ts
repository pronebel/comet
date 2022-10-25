import { Application as PixiApplication, Container } from 'pixi.js';

import type { ContainerNode } from '../../core/nodes/concrete/container';
import Grid from './grid';
import { NodeSelection } from './selection';
import { TransformGizmo } from './transform/gizmo';

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
        this.transformGizmo = new TransformGizmo(this.selection);

        // create canvas and pixi context
        const canvas = this.canvas = document.createElement('canvas');

        const pixi = this.pixi = new PixiApplication({
            view: canvas,
            backgroundColor: 0x111111,
        });

        // create layers
        const gridLayer = this.gridLayer = new Container();
        const nodeLayer = this.nodeLayer = new Container();
        const editLayer = this.editLayer = new Container();

        pixi.stage.addChild(gridLayer);
        pixi.stage.addChild(nodeLayer);
        pixi.stage.addChild(editLayer);

        gridLayer.addChild(Grid.createTilingSprite(screen.availWidth, screen.availHeight));
        nodeLayer.addChild(rootNode.view);
        editLayer.addChild(this.transformGizmo.container);

        // set selection
        pixi.stage.interactive = true;
        pixi.stage.on('mousedown', (e) =>
        {
            const globalX = e.data.global.x;
            const globalY = e.data.global.y;

            const underCursor: ContainerNode[] = [];

            this.rootNode.walk<ContainerNode>((node) =>
            {
                const bounds = node.getBounds();

                if (bounds.contains(globalX, globalY) && !this.selection.isSelected(node) && !node.isMetaNode)
                {
                    underCursor.push(node);
                }
            });

            underCursor.reverse();

            if (underCursor.length === 0)
            {
                this.selection.deselect();
            }
            else
            {
                const selectedNode = underCursor[0];

                if (e.data.originalEvent.shiftKey)
                {
                    this.selection.add(selectedNode);
                }
                else
                {
                    this.selection.set(selectedNode);
                    if (this.transformGizmo.config.enableTranslation)
                    {
                        this.transformGizmo.onDragStart(e);
                    }
                }
            }
        });

        this.selection
            .on('add', this.onAddSelection)
            .on('remove', this.onRemoveSelection);

        (window as any).sel = this.selection;
    }

    public setRoot(rootNode: ContainerNode)
    {
        const { nodeLayer } = this;

        nodeLayer.removeChild(this.rootNode.view);
        this.rootNode = rootNode;
        nodeLayer.addChild(rootNode.view);
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
