import type { ContainerNode } from '../../../core/nodes/concrete/container';
import { createNodeSchema } from '../../../core/nodes/schema';
import { Application } from '../../application';
import { type AddChildCommandReturn, AddChildCommand } from '../../commands/addChild';

export function newDebugNode()
{
    const app = Application.instance;
    const selectedNode = app.editorView.selection.lastNode;

    let parentId = 'Scene:1';

    if (selectedNode)
    {
        parentId = selectedNode.id;
    }

    const nodeSchema = createNodeSchema('Sprite', {
        parent: parentId,
        model: {
            x: 10,
            y: 10,
            scaleX: 3,
            scaleY: 3,
            tint: Math.round(Math.random() * 100000),
        },
    });

    const { nodes } = app.exec<AddChildCommandReturn>(new AddChildCommand({ parentId, nodeSchema }));

    const node = nodes[0] as unknown as ContainerNode;

    app.editorView.selection.set(node);

    console.log(node);
}
