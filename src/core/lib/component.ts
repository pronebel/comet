import EventEmitter from 'eventemitter3';

import type { Model } from './model/model';
import { createModel } from './model/model';
import type { ModelSchema } from './model/schema';

export type AnyComponent = Component<any, any>;

let id = 0;

export abstract class Component<M extends object, V> extends EventEmitter<'modified'>
{
    public model: Model<M> & M;
    public view: V;

    public parent?: AnyComponent;
    public children: AnyComponent[];

    public id: string;

    constructor(props: Partial<M> = {}, linkedTo?: Component<M, V>)
    {
        super();

        this.id = `foo${++id}`;
        (window as any)[this.id] = this;

        this.children = [];

        const schema = this.modelSchema();

        this.model = createModel(schema, {
            ...props,
        });

        if (linkedTo)
        {
            this.link(linkedTo);
        }

        this.model.on('modified', this.onModelModified);

        this.view = this.createView();

        this.update();
    }

    public dispose()
    {
        this.model.off('modified', this.onModelModified);
    }

    protected onModelModified = <T>(key: string, value: T, oldValue: T) =>
    {
        this.emit('modified', key, value, oldValue);
        this.update();
    };

    public copy<T extends Component<M, V>>(linked = true): T
    {
        const Ctor = Object.getPrototypeOf(this).constructor as {
            new (props: Partial<M>, linked?: Component<M, V>): T;
        };
        const component = new Ctor({}, linked ? this : undefined);

        // todo: recreate current children, respecting link/unlinked...
        this.children.forEach((child) =>
        {
            const childComponent = child.copy(linked);

            childComponent.setParent(component);
        });

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

    public setParent(component: AnyComponent)
    {
        if (this.parent)
        {
            this.parent.removeChild(this);
        }
        this.parent = component;
        component.children.push(this);
        this.onAddedToParent();
    }

    public addChild(component: AnyComponent)
    {
        if (component === this)
        {
            throw new Error('"Cannot add component to self"');
        }
        component.setParent(this);
    }

    public removeChild(component: AnyComponent)
    {
        const { children } = this;
        const index = children.indexOf(component);

        if (index > -1)
        {
            component.onRemoveFromParent();
            children.splice(index, 1);
        }
        else
        {
            throw new Error('"Cannot remove child which is not in parent"');
        }
    }

    protected onAddedToParent()
    {
        //
    }

    protected onRemoveFromParent()
    {
        //
    }

    public get isDisplayObject()
    {
        return true;
    }

    public getView<T>()
    {
        return this.view as unknown as T;
    }

    public update()
    {
        this.updateView();
    }

    public abstract modelSchema(): ModelSchema<M>;

    public abstract createView(): V;

    public abstract updateView(): void;
}
