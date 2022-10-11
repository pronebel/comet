import type { Container } from 'pixi.js';

import { registerNodeType } from '../nodeFactory';
import { type ContainerModel, ContainerNode } from './container';

export class SceneNode extends ContainerNode<ContainerModel, Container>
{
    public nodeType()
    {
        return 'Scene';
    }

    public get isMetaNode()
    {
        return true;
    }
}

registerNodeType(SceneNode);
