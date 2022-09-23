import type { Container } from 'pixi.js';

import { type ContainerModel, ContainerNode } from './container';

export class SceneNode extends ContainerNode<ContainerModel, Container>
{
    public nodeType()
    {
        return 'Scene';
    }
}

