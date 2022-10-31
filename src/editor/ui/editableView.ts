import type { InteractionEvent } from 'pixi.js';
import { Application as PixiApplication, Container } from 'pixi.js';

import type { ContainerNode } from '../../core/nodes/concrete/container';
import Grid from './grid';
import { NodeSelection } from './selection';
import { TransformGizmo } from './transform';

export const dblClickMsThreshold = 250;

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

    protected lastClick: number;

    constructor(rootNode: ContainerNode)
    {
        this.rootNode = rootNode;
        this.selection = new NodeSelection();
        this.transformGizmo = new TransformGizmo();
        this.lastClick = -1;

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
        editLayer.addChild(this.transformGizmo.frame.container);

        // set selection
        pixi.stage.interactive = true;
        pixi.stage
            .on('mousedown', (e: InteractionEvent) =>
            {
                const globalX = e.data.global.x;
                const globalY = e.data.global.y;

                const underCursor = this.getUnderCursor(globalX, globalY);

                let wasDoubleClick = false;

                if (this.lastClick > -1)
                {
                    const delta = Date.now() - this.lastClick;

                    if (delta < dblClickMsThreshold)
                    {
                        wasDoubleClick = true;
                    }
                }

                if (wasDoubleClick && underCursor.length > 0)
                {
                    this.selectWithDrag(underCursor[0], e);
                }
                else if (!this.transformGizmo.getGlobalBounds().contains(globalX, globalY))
                {
                    if (underCursor.length === 0)
                    {
                        this.selection.deselect();
                        this.transformGizmo.deselect();
                    }
                    else
                    {
                        const selectedNode = underCursor[0].getCloneRoot().cast<ContainerNode>();

                        if (e.data.originalEvent.shiftKey)
                        {
                            this.selection.add(underCursor[0]);
                        }
                        else
                        {
                            this.selectWithDrag(selectedNode, e);
                        }
                    }
                }

                this.lastClick = Date.now();
            });

        this.selection
            .on('add', this.onAddSelection)
            .on('remove', this.onRemoveSelection);

        (window as any).sel = this.selection;
    }

    protected selectWithDrag(selectedNode: ContainerNode, e: InteractionEvent)
    {
        this.selection.set(selectedNode);

        if (this.transformGizmo.config.enableTranslation)
        {
            this.transformGizmo.onMouseDown(e);
        }
    }

    protected getUnderCursor(globalX: number, globalY: number)
    {
        const underCursor: ContainerNode[] = [];

        this.rootNode.walk<ContainerNode>((node) =>
        {
            const bounds = node.getGlobalBounds();

            if (bounds.contains(globalX, globalY) && !node.isMetaNode)
            {
                underCursor.push(node);
            }
        });

        underCursor.reverse();

        return underCursor;
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
        if (this.selection.isSingle)
        {
            this.transformGizmo.selectSingleNode(node);
        }
        else
        {
            this.transformGizmo.selectMultipleNodes(this.selection.nodes);
        }
    };

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected onRemoveSelection = (node: ContainerNode) =>
    {
        //
    };
}
