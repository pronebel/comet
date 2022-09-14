import type { Container } from 'pixi.js';

import { type ContainerModel, ContainerNode } from './container';

export class SceneNode extends ContainerNode<ContainerModel, Container>
{
    protected init(): void
    {
        super.init();

        this.setCustomProperty('scnProp', 'string', 'foo');
    }
}
