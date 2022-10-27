import { Container } from 'pixi.js';

import type { ModelBase } from '../../model/model';
import { ModelSchema } from '../../model/schema';
import { setParent } from '../../util/transform';
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

        this.postUpdateView();
    }

    protected removeViewFromParent(parent: ClonableNode<ModelBase, object, string>): void
    {
        const thisView = this.view;
        const parentView = parent.getView<Container>();

        parentView.removeChild(thisView);

        this.postUpdateView();
    }

    public postUpdateView(): void
    {
        const view = this.view;

        if (view.parent)
        {
            // setParent(view, view.parent);
            //     view.updateTransform();

            //     const matrix = view.worldTransform.clone();

            //     view.parent.updateTransform();
            //     const parentMatrix = view.parent.worldTransform.clone();

            //     parentMatrix.invert();
            //     matrix.prepend(parentMatrix);

        //     view.transform.setFromMatrix(matrix);
        }
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

