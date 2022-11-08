import Color from 'color';

import type { ContainerNode } from '../../core/nodes/concrete/container';
import type { SpriteModel } from '../../core/nodes/concrete/sprite';
import { createNodeSchema } from '../../core/nodes/schema';
import { Application } from '../application';
import { type AddChildCommandReturn, AddChildCommand } from '../commands/addChild';

const rnd = () => Math.random() * 255;

export function newSprite(values: Partial<SpriteModel> = {})
{
    const app = Application.instance;
    const selectedNode = app.editorView.selection.lastNode;

    let parentId = 'Scene:1';

    if (selectedNode)
    {
        parentId = selectedNode.id;
    }

    const tint = Color.rgb(rnd(), rnd(), rnd());

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

    const node = nodes[0] as unknown as ContainerNode;

    app.editorView.selection.set(node);

    return node;
}
