import type { ContainerNode } from '../../../core/nodes/concrete/container';
import { createNodeSchema } from '../../../core/nodes/schema';
import { Application } from '../../application';
import { type AddChildCommandReturn, AddChildCommand } from '../../commands/addChild';

export function newDebugNode()
{
    const app = Application.instance;
    const { focusEditorView } = app;
    let parentId = 'Scene:1';

    if (focusEditorView?.selection.lastNode)
    {
        parentId = focusEditorView?.selection.lastNode.id;
    }

    const nodeSchema = createNodeSchema('Debug', {
        parent: parentId,
        model: {
            x: 10,
            y: 10,
            width: 25,
            height: 25,
            tint: Math.round(Math.random() * 100000),
        },
    });

    const { nodes } = app.exec<AddChildCommandReturn>(new AddChildCommand({ parentId, nodeSchema }));

    if (focusEditorView)
    {
        const node = nodes[0] as ContainerNode;

        focusEditorView.selection.add(node);
    }
}
