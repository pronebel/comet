import { Container } from 'pixi.js';

import { ModelSchema } from '../model/schema';
import type { Nestable } from '../nestable';
import type { DisplayObjectModel } from './displayObject';
import { DisplayObjectComponent, schema as displayObjectSchema } from './displayObject';

export interface ContainerModel extends DisplayObjectModel
{
    width: number;
    height: number;
}

export const schema = new ModelSchema<ContainerModel>({
    ...displayObjectSchema.defaults,
    width: 16,
    height: 16,
}, displayObjectSchema.constraints);

export class ContainerComponent<
    M extends ContainerModel = ContainerModel,
    V extends Container = Container,
> extends DisplayObjectComponent<M, V>
{
    public modelSchema(): ModelSchema<M>
    {
        return schema as unknown as ModelSchema<M>;
    }

    public createView(): V
    {
        return new Container() as V;
    }

    public updateView(): void
    {
        const { view, model: { values: {
            width, height,
        } } } = this;

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
            const parentView = this.getParent<ContainerComponent>().getView<Container>();

            parentView.addChild(thisView);
        }
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected onRemovedFromParent(oldParent: Nestable): void
    {
        super.onRemovedFromParent(oldParent);

        const parent = oldParent as unknown as ContainerComponent;

        const thisView = this.view;
        const parentView = parent.getView<Container>();

        parentView.removeChild(thisView);
    }
}
