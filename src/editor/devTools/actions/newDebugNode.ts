import type { ContainerNode } from '../../../core/nodes/concrete/container';
import { createNodeSchema } from '../../../core/nodes/schema';
import { Application } from '../../application';
import { type AddChildCommandReturn, AddChildCommand } from '../../commands/addChild';

export function newDebugNode()
{
    const app = Application.instance;

    const parentId = 'Scene:1';

    // if (app.editorView.selection.lastNode)
    // {
    //     parentId = app.editorView.selection.lastNode.id;
    // }

    const nodeSchema = createNodeSchema('Debug', {
        parent: parentId,
        model: {
            x: 10,
            y: 10,
            width: 20,
            height: 20,
            tint: Math.round(Math.random() * 100000),
        },
    });

    const { nodes } = app.exec<AddChildCommandReturn>(new AddChildCommand({ parentId, nodeSchema }));

    const node = nodes[0] as unknown as ContainerNode;

    app.editorView.selection.set(node);
}
