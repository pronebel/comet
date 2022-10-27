import { Container } from 'pixi.js';

import type { ModelBase } from '../../model/model';
import { ModelSchema } from '../../model/schema';
import type { ClonableNode } from '../abstract/clonableNode';
import type { DisplayObjectEvents, DisplayObjectModel } from '../abstract/displayObject';
import { DisplayObjectNode, displayObjectSchema } from '../abstract/displayObject';

export type ContainerEvents = DisplayObjectEvents;

export type ContainerModel = DisplayObjectModel;

export const containerSchema = new ModelSchema<ContainerModel>({
    ...displayObjectSchema.defaults,
}, displayObjectSchema.constraints);

export class ContainerNode<
    M extends ContainerModel = ContainerModel,
    V extends Container = Container,
    E extends string = ContainerEvents,
> extends DisplayObjectNode<M, V, E>
{
    public nodeType()
    {
        return 'Container';
    }

    public modelSchema(): ModelSchema<M>
    {
        return containerSchema as unknown as ModelSchema<M>;
    }

    public createView(): V
    {
        return new Container() as V;
    }

    protected initView()
    {
        (this.view as any).id = this.id;
    }

    protected addViewToParent(parent: ClonableNode<ModelBase, object, string>): void
    {
        const thisView = this.view;
        const parentView = parent.getView<Container>();

        parentView.addChild(thisView);
    }

    protected removeViewFromParent(parent: ClonableNode<ModelBase, object, string>): void
    {
        const thisView = this.view;
        const parentView = parent.getView<Container>();

        parentView.removeChild(thisView);
    }

    protected onCloaked(): void
    {
        this.removeViewFromParent(this.getParent<ClonableNode>());
    }

    protected onUncloaked(): void
    {
        this.addViewToParent(this.getParent<ClonableNode>());
    }
}

