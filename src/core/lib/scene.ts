import type { Container } from 'pixi.js';

import { type ContainerModel, ContainerComponent } from './components/container';

export class Scene extends ContainerComponent<ContainerModel, Container>
{
    protected init(): void
    {
        super.init();

        this.setCustomProperty('scnProp', 'string', 'foo');
    }
}
