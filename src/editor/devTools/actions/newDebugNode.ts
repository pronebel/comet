import { createNodeSchema } from '../../../core/nodes/schema';
import { Application } from '../../application';
import { AddChildCommand } from '../../commands/addChild';

export function newDebugNode()
{
    const app = Application.instance;
    const parentId = 'Scene:1';
    const nodeSchema = createNodeSchema('Debug', {
        parent: parentId,
        model: {
            x: 20,
            y: 20,
            width: 20,
            height: 20,
            tint: Math.round(Math.random() * 100000),
        },
    });

    app.exec(new AddChildCommand({ parentId, nodeSchema }));
}
