import type { InteractionEvent } from 'pixi.js';
import { Application as PixiApplication, Container } from 'pixi.js';
import { Viewport } from 'pixi-viewport';

import type { DisplayObjectNode } from '../../core/nodes/abstract/displayObject';
import type { ContainerNode } from '../../core/nodes/concrete/container';
import { Application } from '../application';
import Grid from './grid';
import { isKeyPressed } from './keyboard';
import { TransformGizmo } from './transform/gizmo';

export const dblClickMsThreshold = 250;

export class EditableView
{
    public rootNode: ContainerNode;
    public canvas: HTMLCanvasElement;
    public pixi: PixiApplication;
    public transformGizmo: TransformGizmo;
    public gridLayer: Container;
    public nodeLayer: Container;
    public editLayer: Container;
    public viewport: Viewport;

    protected lastClick: number;

    constructor(rootNode: ContainerNode)
    {
        // create canvas and pixi context
        const canvas = this.canvas = document.createElement('canvas');

        const pixi = this.pixi = new PixiApplication({
            view: canvas,
            backgroundColor: 0x111111,
        });

        const viewport = this.viewport = new Viewport({
            screenWidth: window.innerWidth,
            screenHeight: window.innerHeight,
            worldWidth: 1000,
            worldHeight: 1000,

            interaction: pixi.renderer.plugins.interaction,
        });

        this.rootNode = rootNode;
        this.transformGizmo = new TransformGizmo({
            rootContainer: viewport,
        });
        this.lastClick = -1;

        // create layers
        const gridLayer = this.gridLayer = new Container();
        const nodeLayer = this.nodeLayer = new Container();
        const editLayer = this.editLayer = new Container();

        (window as any).stage = pixi.stage;

        pixi.stage.addChild(viewport);

        viewport.addChild(gridLayer);
        viewport.addChild(nodeLayer);
        viewport.addChild(editLayer);

        gridLayer.addChild(Grid.createTilingSprite(screen.availWidth, screen.availHeight));
        nodeLayer.addChild(rootNode.view);
        editLayer.addChild(this.transformGizmo.frame.container);

        // set selection
        viewport
            .on('mousedown', this.onMouseDown)
            .on('mouseup', this.onMouseUp);

        viewport
            .drag()
            .pinch()
            .wheel();
    }

    protected wasDoubleClick()
    {
        return this.lastClick > -1
            && Date.now() - this.lastClick < dblClickMsThreshold;
    }

    protected onMouseDown = (e: InteractionEvent) =>
    {
        const globalX = e.data.global.x;
        const globalY = e.data.global.y;
        const { selection } = Application.instance;
        const wasDoubleClick = this.wasDoubleClick();
        const underCursor = this.getUnderCursor(globalX, globalY).filter((node) => !selection.has(node));
        const topNode = underCursor[0];
        const isSpacePressed = isKeyPressed(' ');

        if (wasDoubleClick && underCursor.length > 0)
        {
            // handle double click on first node and start dragging
            this.selectWithDrag(topNode, e);
        }
        else if (!this.transformGizmo.frame.getGlobalBounds().contains(globalX, globalY))
        {
            // click outside of transform gizmo area
            if (underCursor.length === 0)
            {
                if (!isSpacePressed)
                {
                    // nothing selected, deselect
                    selection.deselect();
                }
            }
            else
            {
                const selectedNode = topNode.getCloneRoot().cast<DisplayObjectNode>();

                if (e.data.originalEvent.shiftKey)
                {
                    // add to selection
                    selection.add(topNode);
                }
                else
                {
                    // new selection and start dragging
                    this.selectWithDrag(selectedNode, e);
                }
            }
        }
        else if (e.data.originalEvent.shiftKey)
        {
            // click inside transform gizmo area remove from selection if shift down
            const underCursor = this.getUnderCursor(globalX, globalY).filter((node) => selection.has(node));
            const topNode = underCursor[0];

            selection.remove(topNode);
        }

        this.viewport.pause = !isSpacePressed;

        // track last click
        this.lastClick = Date.now();
    };

    protected onMouseUp = () =>
    {
        this.viewport.pause = false;
    };

    protected selectWithDrag(selectedNode: DisplayObjectNode, e: InteractionEvent)
    {
        Application.instance.selection.set(selectedNode);

        if (this.transformGizmo.config.enableTranslation)
        {
            this.transformGizmo.onMouseDown(e);
        }
    }

    protected getUnderCursor(globalX: number, globalY: number)
    {
        const underCursor: DisplayObjectNode[] = [];

        this.rootNode.walk<DisplayObjectNode>((node) =>
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
}
