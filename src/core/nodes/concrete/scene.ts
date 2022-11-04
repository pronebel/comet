import type { Container } from 'pixi.js';
import { MetaNode } from '../abstract/metaNode';
import type { ContainerEvents, ContainerModel } from './container';


export class SceneNode extends MetaNode<ContainerModel, Container, ContainerEvents>
{
    public nodeType()
    {
        return 'Scene';
    }
}

