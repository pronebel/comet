import type { Container } from 'pixi.js';

import { type ContainerModel, ContainerNode } from '../concrete/container';

export class MetaNode<M extends ContainerModel, V extends Container, E extends string> extends ContainerNode<M, V, E>
{
    // @ts-ignore
    public nodeType()
    {
        throw new Error('Method not implemented.');
    }

    public get isMetaNode()
    {
        return true;
    }
}

