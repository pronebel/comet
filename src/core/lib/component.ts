import EventEmitter from 'eventemitter3';

import type components from './components';
import type { Model } from './model/model';
import { createModel } from './model/model';
import type { ModelSchema } from './model/schema';

export type AnyComponent = Component<any, any>;

const ids = {} as Record<keyof typeof components, number>;

export abstract class Component<M extends object, V> extends EventEmitter<'modified' | 'childAdded' | 'childRemoved'>
{
    public model: Model<M> & M;
    public view: V;

    public parent?: AnyComponent;
    public children: AnyComponent[];
    public spawner?: Component<M, V>;

    public id: string;

    constructor(modelValues: Partial<M> = {}, spawner?: Component<M, V>, linked = true)
    {
        super();

        const componentType = this.getComponentType();

        if (!ids[componentType])
        {
            ids[componentType] = 0;
        }

        this.id = `${componentType}:${ids[componentType]++}`;

        this.children = [];

        const schema = this.modelSchema();

        this.model = createModel(schema, {
            ...modelValues,
        });

        this.model.on('modified', this.onModelModified);

        if (spawner)
        {
            this.setSpawner(spawner, linked);
        }

        this.view = this.createView();

        this.update();
    }

    public getComponentType(): keyof typeof components
    {
        return (Object.getPrototypeOf(this).constructor as {
            new (): object;
        }).name as keyof typeof components;
    }

    public findParent<T>(ctor: {
        new (): AnyComponent;
        name: string;
    }): T | undefined
    {
        let ref: AnyComponent | undefined = this.parent;

        while (ref)
        {
            if (ref.getComponentType() === ctor.name)
            {
                return ref as unknown as T;
            }
            ref = ref.parent;
        }

        return undefined;
    }

    public dispose()
    {
        this.model.off('modified', this.onModelModified);

        if (this.spawner)
        {
            this.unlink();
        }
    }

    protected onModelModified = <T>(key: string, value: T, oldValue: T) =>
    {
        this.emit('modified', key, value, oldValue);
        this.update();
    };

    protected onSpawnerChildAdded = (component: AnyComponent) =>
    {
        const copy = component.copy(true);

        this.addChild(copy);
    };

    protected onSpawnerChildRemoved = (component: AnyComponent) =>
    {
        this.children.forEach((child: AnyComponent) =>
        {
            if (child.spawner === component)
            {
                child.deleteSelf();
            }
        });
    };

    public copy<T extends Component<M, V>>(linked = true): T
    {
        const Ctor = Object.getPrototypeOf(this).constructor as {
            new (modelValues: Partial<M>, spawner?: Component<M, V>, linked?: boolean): T;
        };

        const component = new Ctor({}, this, linked);

        this.children.forEach((child) =>
        {
            const childComponent = child.copy(linked);

            childComponent.setParent(component);
        });

        return component as unknown as T;
    }

    protected setSpawner(spawner: Component<M, V>, linked: boolean)
    {
        this.spawner = spawner;

        const { model: sourceModel } = spawner;

        if (linked)
        {
            this.model.link(sourceModel);

            spawner.on('childAdded', this.onSpawnerChildAdded);
            spawner.on('childRemoved', this.onSpawnerChildRemoved);
        }
        else
        {
            const sourceValues = sourceModel.values;

            this.model.setValues(sourceValues);
        }
    }

    public unlink()
    {
        const { model, spawner } = this;

        if (model.parent && spawner)
        {
            model.flatten();

            spawner.off('childAdded', this.onSpawnerChildAdded);
            spawner.off('childRemoved', this.onSpawnerChildRemoved);
        }

        delete this.spawner;

        this.children.forEach((child) => child.unlink());
    }

    public setParent(component: AnyComponent)
    {
        if (this.parent)
        {
            this.parent.removeChild(this);
        }

        this.parent = component;
        component.children.push(this);
        component.emit('childAdded', this);

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
            this.emit('childRemoved', component);
        }
        else
        {
            throw new Error('"Cannot remove child which is not in parent"');
        }
    }

    public deleteSelf()
    {
        if (this.parent)
        {
            this.parent.removeChild(this);
        }
    }

    protected onAddedToParent(): void
    {
        // subclasses
    }

    protected onRemoveFromParent()
    {
        // subclasses
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
