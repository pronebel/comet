import { Container } from 'pixi.js';

import { ModelSchema } from '../../model/schema';
import type { DisplayObjectEvents, DisplayObjectModel } from '../abstract/displayObject';
import { DisplayObjectNode, displayObjectSchema } from '../abstract/displayObject';
import type { GraphNode } from '../abstract/graphNode';

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

    public updateView(): void
    {
        const { view, values: {
            width, height,
        } } = this;

        super.updateView();

        view.width = width;
        view.height = height;
    }

    protected onAddedToParent(): void
    {
        super.onAddedToParent();

        if (this.parent)
        {
            const thisView = this.view;
            const parentView = this.getParent<ContainerNode>().getView<Container>();

            parentView.addChild(thisView);
        }
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected onRemovedFromParent(oldParent: GraphNode): void
    {
        super.onRemovedFromParent(oldParent);

        const parent = oldParent as unknown as ContainerNode;

        const thisView = this.view;
        const parentView = parent.getView<Container>();

        parentView.removeChild(thisView);
    }
}
