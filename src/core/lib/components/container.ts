import { Container } from 'pixi.js';

import type { DisplayObjectModel } from '../displayObjectComponent';
import { DisplayObjectContainer, schema as displayObjectSchema } from '../displayObjectComponent';
import { ModelSchema } from '../model/schema';

export interface ContainerModel extends DisplayObjectModel
{
    width: number;
    height: number;
}

export const schema = new ModelSchema<ContainerModel>({
    ...displayObjectSchema.defaults,
    width: 20,
    height: 20,
}, displayObjectSchema.constraints);

export class ContainerComponent<M extends ContainerModel, V extends Container> extends DisplayObjectContainer<M, V>
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
        if (this.parent)
        {
            const thisView = this.view;
            const parentView = this.parent.getView<Container>();

            parentView.addChild(thisView);
        }
    }

    protected onRemoveFromParent(): void
    {
        if (this.parent)
        {
            const thisView = this.view;
            const parentView = this.parent.getView<Container>();

            parentView.removeChild(thisView);
        }
    }
}
