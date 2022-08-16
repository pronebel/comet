import EventEmitter from 'eventemitter3';

import type { Model, ModelSchema } from '../util/model';
import { createModel } from '../util/model';

export abstract class Component<M extends object, V> extends EventEmitter<'modified'>
{
    public model: Model<M> & M;
    public view: V;

    constructor(props: Partial<M> = {}, linkedTo?: Component<M, V>)
    {
        super();

        const schema = this.modelSchema();

        if (linkedTo)
        {
            this.model = createModel(schema, {
                ...props,
            });
            this.link(linkedTo);
        }
        else
        {
            this.model = createModel(schema, {
                ...props,
            });
        }

        this.model.on('modified', this.onModelModified);

        this.view = this.createView();
        this.updateView();
    }

    public dispose()
    {
        this.model.off('modified', this.onModelModified);
    }

    protected onModelModified = <T>(key: string, value: T, oldValue: T) =>
    {
        this.emit('modified', key, value, oldValue);
        this.updateView();
    };

    public copy<T extends Component<M, V>>(linked = true): T
    {
        const Ctor = Object.getPrototypeOf(this).constructor as {
            new (props: Partial<M>, linked?: Component<M, V>): T;
        };
        const component = new Ctor({}, linked ? this : undefined);

        // todo: recreate current children, respecting link/unlinked...

        return component as unknown as T;
    }

    protected link(sourceComponent: Component<M, V>)
    {
        const { model } = this;
        const { model: sourceModel } = sourceComponent;

        model.parent = sourceModel;
        sourceModel.children.push(model);
    }

    public unlink()
    {
        const { model } = this;

        model.flatten();
        model.parent = undefined;
    }

    public abstract modelSchema(): ModelSchema<M>;

    public abstract createView(): V;

    public abstract updateView(): void;
}
