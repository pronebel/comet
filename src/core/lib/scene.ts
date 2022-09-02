import { ContainerComponent } from './components/container';

export class Scene
{
    public root: ContainerComponent;

    constructor()
    {
        this.root = new ContainerComponent();
    }
}
