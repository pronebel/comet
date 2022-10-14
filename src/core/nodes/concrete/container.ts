import { Container } from 'pixi.js';

import type { ModelBase } from '../../model/model';
import { ModelSchema } from '../../model/schema';
import type { ClonableNode } from '../abstract/clonableNode';
import type { DisplayObjectEvents, DisplayObjectModel } from '../abstract/displayObject';
import { DisplayObjectNode, displayObjectSchema } from '../abstract/displayObject';

export type ContainerEvents = DisplayObjectEvents;

export interface ContainerModel extends DisplayObjectModel
{
    width: number;
    height: number;
}

export const containerSchema = new ModelSchema<ContainerModel>({
    ...displayObjectSchema.defaults,
    width: 16,
    height: 16,
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

    // public updateView(): void
    // {
    //     const { view, values: {
    //         width, height,
    //     } } = this;

    //     super.updateView();

    //     view.width = width;
    //     view.height = height;
    // }

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

