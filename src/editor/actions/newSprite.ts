import Color from 'color';

import type { ContainerNode } from '../../core/nodes/concrete/container';
import type { SpriteModel, SpriteNode } from '../../core/nodes/concrete/sprite';
import { createNodeSchema } from '../../core/nodes/schema';
import { Application } from '../application';
import { type AddChildCommandReturn, AddChildCommand } from '../commands/addChild';
import { Action } from '../core/action';

export class NewSpriteAction extends Action<SpriteNode>
{
    constructor()
    {
        super('newSprite', {
            hotkey: 'Ctrl+N',
        });
    }

    protected rnd255()
    {
        return Math.random() * 255;
    }

    protected exec(values: Partial<SpriteModel> = {}): SpriteNode
    {
        const app = Application.instance;
        const selectedNode = app.editorView.selection.lastNode;

        let parentId = 'Scene:1';

        if (selectedNode)
        {
            parentId = selectedNode.id;
        }

        const tint = Color.rgb(this.rnd255(), this.rnd255(), this.rnd255());

        tint.lighten(0.5);

        const nodeSchema = createNodeSchema('Sprite', {
            parent: parentId,
            model: {
                x: 10,
                y: 10,
                scaleX: 1,
                scaleY: 1,
                tint: tint.rgbNumber(),
                ...values,
            },
        });

        const { nodes } = app.undoStack.exec<AddChildCommandReturn>(new AddChildCommand({ parentId, nodeSchema }));

        const node = nodes[0] as unknown as SpriteNode;

        app.editorView.selection.set(node.cast<ContainerNode>());

        return node;
    }
}
