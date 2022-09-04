import { CloneInfo, CloneMode } from './clone';
import type { CustomProperty, CustomPropertyType } from './model/customProps';
import { CustomProperties } from './model/customProps';
import type { Model } from './model/model';
import { createModel } from './model/model';
import type { ModelSchema } from './model/schema';
import type { NestableEvents } from './nestable';
import { Nestable } from './nestable';

const ids = {} as Record<string, number>;

export type AnyComponent = Component<any, any>;

// todo: this might need to be extended by subclasses, may need to be generic parameter
export type ComponentEvents = NestableEvents | 'unlinked';

export abstract class Component<M extends object, V> extends Nestable<ComponentEvents>
{
    public id: string;

    public model: Model<M> & M;
    public view: V;

    public cloneInfo: CloneInfo<Component<M, V>>;

    public customProperties: CustomProperties;

    constructor(
        modelValues: Partial<M> = {},
        cloneInfo: CloneInfo<Component<M, V>> = new CloneInfo<Component<M, V>>(),
    )
    {
        super();

        const componentType = this.getComponentType();

        if (!ids[componentType])
        {
            ids[componentType] = 1;
        }

        this.id = `${componentType}:${ids[componentType]++}`;

        this.children = [];

        this.cloneInfo = cloneInfo;

        const { cloner } = this.cloneInfo;

        if (cloner && cloneInfo.isReference)
        {
            this.model = cloner.model;
        }
        else
        {
            const schema = this.modelSchema();

            this.model = createModel(schema, {
                ...modelValues,
            });
        }

        this.customProperties = new CustomProperties();

        this.initModel();
        this.initSpawning();
        this.view = this.createView();
        this.init();
        this.update();
    }

    protected init()
    {
        // for subclasses...
    }

    protected initModel()
    {
        this.model.on('modified', this.onModelModified);
    }

    protected onModelModified = <T>(key: string, value: T, oldValue: T) =>
    {
        this.update();

        this.emit('modified', key, value, oldValue);
    };

    public clone<T extends Component<M, V>>(cloneMode: CloneMode = CloneMode.Variant, isRoot = true): T
    {
        const Ctor = Object.getPrototypeOf(this).constructor as {
            new (modelValues: Partial<M>, cloneInfo?: CloneInfo<Component<M, V>>): T;
        };

        const component = new Ctor(
            {},
            new CloneInfo(cloneMode === CloneMode.Reference && isRoot ? CloneMode.ReferenceRoot : cloneMode, this),
        );

        this.children.forEach((child) =>
        {
            const childComponent = (child as AnyComponent).clone(cloneMode, false);

            childComponent.setParent(component);
        });

        component.onCloned();

        return component as unknown as T;
    }

    public onCloned()
    {
        const { cloneInfo: { cloner, isDuplicate } } = this;

        if (cloner)
        {
            this.customProperties = cloner.customProperties.clone();

            if (isDuplicate)
            {
                this.walk<AnyComponent>((component) =>
                {
                    const customProps = component.getDefinedCustomProps();

                    component.customProperties = customProps;
                    customProps.unlink(component);
                });
            }
        }
    }

    protected initSpawning()
    {
        const { cloner, cloneMode, isVariant, isReferenceRoot } = this.cloneInfo;

        if (cloner)
        {
            cloner.cloneInfo.cloned.push(this);

            const { model: sourceModel } = cloner;

            if (isVariant || isReferenceRoot)
            {
                this.model.link(sourceModel);

                if (isReferenceRoot)
                {
                    cloner.model.isReference = true;
                    this.model.isReference = true;
                }
            }
            else if (cloneMode === CloneMode.Duplicate)
            {
                const sourceValues = sourceModel.values;

                this.model.setValues(sourceValues);
            }

            cloner.on('childAdded', this.onSpawnerChildAdded);
            cloner.on('childRemoved', this.onSpawnerChildRemoved);
        }
    }

    protected onSpawnerChildAdded = (component: AnyComponent) =>
    {
        const { cloneMode } = this.cloneInfo;

        const copy = component.clone(
            cloneMode === CloneMode.ReferenceRoot ? CloneMode.Reference : cloneMode,
            false,
        );

        this.addChild(copy);
    };

    protected onSpawnedChildAdded = (component: AnyComponent) =>
    {
        const copy = component.clone(
            CloneMode.Reference,
            false,
        );

        copy.parent = this;
        this.children.push(copy);

        copy.onAddedToParent();
    };

    protected onSpawnerChildRemoved = (component: AnyComponent) =>
    {
        this.children.forEach((child) =>
        {
            if ((child as AnyComponent).cloneInfo.isClonedFrom(component))
            {
                child.deleteSelf();
            }
        });
    };

    public getView<T = V>(): T
    {
        return this.view as unknown as T;
    }

    public dispose()
    {
        super.dispose();

        this.model.off('modified', this.onModelModified);

        if (this.cloneInfo.wasCloned)
        {
            this.unlink();
        }

        this.emit('disposed');

        this.cloneInfo.cloned.forEach((component) => component.unlink());

        this.children.forEach((child) =>
        {
            child.dispose();
        });

        this.removeAllListeners();
    }

    public unlink(unlinkChildren = true)
    {
        const { model, cloneInfo: { cloner, isVariant, isReference, isReferenceRoot } } = this;

        if (cloner)
        {
            if ((model.parent && isVariant) || isReferenceRoot)
            {
                model.flatten();
            }
            else if (isReference)
            {
                this.model = cloner.model.copy();

                this.initModel();
            }

            cloner.off('childAdded', this.onSpawnerChildAdded);
            cloner.off('childRemoved', this.onSpawnerChildRemoved);

            this.cloneInfo.unlink();
            this.customProperties.unlink(this);

            this.emit('unlinked');

            this.update();
        }

        if (unlinkChildren)
        {
            this.children.forEach((child) => (child as AnyComponent).unlink());
        }
    }

    protected onAddedToParent(): void
    {
        const parent = this.getParent<AnyComponent>();

        const { cloneInfo: { cloner, isReferenceOrRoot } }  = parent;

        if (cloner && isReferenceOrRoot)
        {
            if (parent.children.length !== cloner.children.length)
            {
                cloner.onSpawnedChildAdded(this);
            }
        }
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected onRemovedFromParent(oldParent: Nestable)
    {
        const { cloneInfo: { cloner, isReferenceOrRoot, cloned: cloneed } } = this;

        if (cloner && isReferenceOrRoot)
        {
            cloner.deleteSelf();
        }
        else
        {
            cloneed.forEach((cloneedComponent) =>
            {
                const { cloneInfo: { cloner, isReferenceOrRoot } } = cloneedComponent;

                const isSameComponent = cloner === this;

                if (isSameComponent && isReferenceOrRoot)
                {
                    cloneedComponent.deleteSelf();
                }
            });
        }
    }

    public update()
    {
        if (this.view)
        {
            this.updateView();
        }
    }

    public get values()
    {
        const values = this.model.values;

        // todo: override with customProps as discoverable

        return values;
    }

    public get(modelKey: keyof M)
    {
        return this.model.getValue(modelKey);
    }

    public set<K extends keyof M>(modelKey: K, value: M[K])
    {
        this.model.setValue(modelKey, value);
    }

    public defineCustomProperty(name: string, type: CustomPropertyType, value: any): CustomProperty
    {
        return this.customProperties.define(this, name, type, value);
    }

    public unDefineCustomProperty(name: string)
    {
        this.customProperties.unDefine(this, name);
    }

    public getDefinedCustomPropsAsArray(props: CustomProperty[] = [])
    {
        this.walk<AnyComponent>((component) =>
        {
            component.customProperties.values().forEach((array) => props.push(...array));
        }, {
            direction: 'up',
        });

        return props;
    }

    public getDefinedCustomProps()
    {
        const array = this.getDefinedCustomPropsAsArray();
        const customProps = new CustomProperties();

        array.forEach((property) =>
        {
            customProps.addProperty(property);
        });

        return customProps;
    }

    public abstract modelSchema(): ModelSchema<M>;

    public abstract createView(): V;

    public abstract updateView(): void;
}

