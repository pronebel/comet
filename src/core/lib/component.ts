import { CloneInfo, CloneMode } from './clone';
import type { CustomProperty, CustomPropertyType } from './customProperties';
import { CustomProperties } from './customProperties';
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
        this.initCloning();
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
                    const customProps = component.getCustomProps();

                    customProps.unlink(component);
                    component.customProperties = customProps;
                });
            }
        }
    }

    protected initCloning()
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

            cloner.on('childAdded', this.onClonerChildAdded);
            cloner.on('childRemoved', this.onClonerChildRemoved);
        }
    }

    protected onClonerChildAdded = (component: AnyComponent) =>
    {
        const { cloneMode } = this.cloneInfo;

        const copy = component.clone(
            cloneMode === CloneMode.ReferenceRoot ? CloneMode.Reference : cloneMode,
            false,
        );

        this.addChild(copy);
    };

    protected onClonedChildAdded = (component: AnyComponent) =>
    {
        const copy = component.clone(
            CloneMode.Reference,
            false,
        );

        copy.parent = this;
        this.children.push(copy);

        copy.onAddedToParent();
    };

    protected onClonerChildRemoved = (component: AnyComponent) =>
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
                this.model = cloner.model.clone();

                this.initModel();
            }

            cloner.off('childAdded', this.onClonerChildAdded);
            cloner.off('childRemoved', this.onClonerChildRemoved);

            this.cloneInfo.unlink();
            this.customProperties.unlink(this);

            this.emit('unlinked');

            this.update();
        }

        if (unlinkChildren)
        {
            this.forEach<AnyComponent>((child) => child.unlink());
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
                cloner.onClonedChildAdded(this);
            }
        }
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected onRemovedFromParent(oldParent: Nestable)
    {
        const { cloneInfo: { cloner, isReferenceOrRoot, cloned } } = this;

        if (cloner && isReferenceOrRoot)
        {
            cloner.deleteSelf();
        }
        else
        {
            cloned.forEach((clonedComponent) =>
            {
                const { cloneInfo: { cloner, isReferenceOrRoot } } = clonedComponent;

                const isSameComponent = cloner === this;

                if (isSameComponent && isReferenceOrRoot)
                {
                    clonedComponent.deleteSelf();
                }
            });
        }
    }

    public update(recursive = false)
    {
        if (this.view)
        {
            this.updateView();
        }

        if (recursive)
        {
            this.forEach<AnyComponent>((child) => child.update(true));
        }
    }

    public get values()
    {
        const values = this.model.values;

        const customProps = this.getCustomProps();

        // todo: override with customProps as discoverable
        for (const [key] of Object.entries(values))
        {
            const assignedValue = customProps.getAssignedValue(String(key));

            if (assignedValue !== undefined)
            {
                values[key as keyof M] = assignedValue;
            }
        }

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

    public setCustomProperty(name: string, type: CustomPropertyType, value: any): CustomProperty
    {
        const property = this.customProperties.set(this, name, type, value);

        this.update(true);

        return property;
    }

    public removeCustomProperty(name: string)
    {
        this.customProperties.remove(this, name);
        this.update();
    }

    public getAvailableCustomPropsAsArray(props: CustomProperty[] = [])
    {
        this.walk<AnyComponent>((component) =>
        {
            component.customProperties.values().forEach((array) => props.push(...array));
        }, {
            direction: 'up',
        });

        return props;
    }

    public getCustomProps()
    {
        const array = this.getAvailableCustomPropsAsArray();
        const customProps = new CustomProperties();

        array.forEach((property) =>
        {
            customProps.addProperty(property);
        });

        customProps.assignments = this.customProperties.assignments;

        return customProps;
    }

    public assignCustomProperty(modelKey: keyof M, customPropertyKey: string)
    {
        this.customProperties.assign(String(modelKey), customPropertyKey);
        // todo: will this update do children and cloned?
        this.update();
    }

    public unAssignCustomProperty(modelKey: keyof M)
    {
        this.customProperties.unAssign(String(modelKey));
        this.update();
    }

    public abstract modelSchema(): ModelSchema<M>;

    public abstract createView(): V;

    public abstract updateView(): void;
}

