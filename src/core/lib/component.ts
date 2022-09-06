import type { Clonable } from './clone';
import { CloneInfo, CloneMode } from './clone';
import type { CustomProperty, CustomPropertyType } from './customProperties';
import { CustomProperties } from './customProperties';
import { doc } from './document';
import type { Model } from './model/model';
import { createModel } from './model/model';
import type { ModelSchema } from './model/schema';
import type { NestableEvents } from './nestable';
import { Nestable } from './nestable';

const ids = {} as Record<string, number>;

// todo: this might need to be extended by subclasses, may need to be generic parameter
export type ComponentEvents = NestableEvents | 'unlinked';

export abstract class Component<
    M = any,
    V = any,
    E extends string = ComponentEvents,
> extends Nestable<ComponentEvents | E> implements Clonable
{
    public id: string;

    public model: Model<M> & M;
    public view: V;

    public cloneInfo: CloneInfo;
    public customProperties: CustomProperties<Component>;

    constructor(
        modelValues: Partial<M> = {},
        cloneInfo: CloneInfo = new CloneInfo(),
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

        const cloner = this.cloneInfo.getCloner<Component>();

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

        this.view = this.createView();

        this.initModel();

        doc.emit('constructed', this);

        this.initCloning();

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

    protected initCloning()
    {
        const { cloneInfo, cloneInfo: { cloneMode, isVariant, isReferenceRoot } } = this;

        const cloner = cloneInfo.getCloner<Component>();

        if (cloner)
        {
            cloner.cloneInfo.cloned.push(this);

            const { model: sourceModel } = cloner;

            // note: Reference case is handled immediately in Component constructor as model is shared

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

    public clone<T extends Component>(cloneMode: CloneMode = CloneMode.Variant, depth = 0): T
    {
        const Ctor = Object.getPrototypeOf(this).constructor as {
            new (modelValues: Partial<M>, cloneInfo?: CloneInfo): T;
        };

        const component = new Ctor(
            {},
            new CloneInfo(
                cloneMode === CloneMode.Reference && depth === 0
                    ? CloneMode.ReferenceRoot
                    : cloneMode,
                this,
            ),
        );

        doc.emit('cloned', this, component, cloneMode, depth);

        this.forEach<Component>((child) =>
        {
            const childComponent = (child).clone(cloneMode, depth + 1);

            childComponent.setParent(component);
        });

        component.onCloned();

        return component;
    }

    public onCloned()
    {
        const { cloneInfo, cloneInfo: { isDuplicate } } = this;
        const cloner = cloneInfo.getCloner<Component>();

        if (cloner)
        {
            if (isDuplicate)
            {
                this.unlinkCustomProperties();
            }
            else
            {
                this.customProperties = cloner.customProperties.clone();
            }

            this.updateRecursive();
        }
    }

    public unlinkCustomProperties()
    {
        this.walk<Component>((component) =>
        {
            const componentCloner = component.cloneInfo.getCloner<Component>();

            if (componentCloner)
            {
                const props = componentCloner.customProperties;

                component.customProperties = props.clone().unlink(component);

                componentCloner.customProperties.cloneInfo.removeCloned(component.customProperties);
            }
        });
    }

    public unlink(unlinkChildren = true)
    {
        const { model, cloneInfo, cloneInfo: { isVariant, isReference, isReferenceRoot, isDuplicate } } = this;
        const cloner = cloneInfo.getCloner<Component>();

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

            if (!isDuplicate)
            {
                this.unlinkCustomProperties();
            }

            cloner.cloneInfo.removeCloned(this);
            this.cloneInfo.unlink();

            this.emit('unlinked');

            this.update();
        }

        if (unlinkChildren)
        {
            this.forEach<Component>((child) => child.unlink());
        }
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

        this.cloneInfo.forEachCloned<Component>((component) => component.unlink());

        this.children.forEach((child) =>
        {
            child.dispose();
        });

        this.removeAllListeners();
    }

    public deleteSelf(): void
    {
        super.deleteSelf();

        doc.emit('delete', this);
    }

    public update(recursive = false)
    {
        if (this.view)
        {
            this.updateView();
        }

        if (recursive)
        {
            this.forEach<Component>((child) => child.update(true));
        }
    }

    public updateRecursive()
    {
        return this.update(true);
    }

    public updateRecursiveWithClones()
    {
        this.walk<Component>((component) =>
        {
            component.update();

            component.cloneInfo.forEachCloned<Component>((cloned) => cloned.updateRecursiveWithClones());
        });
    }

    protected onModelModified = <T>(key: string, value: T, oldValue: T) =>
    {
        this.update();

        this.emit('modified', key, value, oldValue);
        // doc.emit('modelModified', this, key, value, oldValue);
    };

    protected onClonerChildAdded = (component: Component) =>
    {
        const { cloneMode } = this.cloneInfo;

        const copy = component.clone(
            cloneMode === CloneMode.ReferenceRoot ? CloneMode.Reference : cloneMode,
            1,
        );

        this.addChild(copy);
    };

    protected onClonedChildAdded = (component: Component) =>
    {
        const copy = component.clone(
            CloneMode.Reference,
            1,
        );

        copy.parent = this;
        this.children.push(copy);

        copy.onAddedToParent();

        doc.emit('childAdded', this, copy);
    };

    protected onClonerChildRemoved = (component: Component) =>
    {
        this.forEach<Component>((child) =>
        {
            if ((child).cloneInfo.isClonedFrom(component))
            {
                doc.emit('childRemoved', this, child);
                child.deleteSelf();
            }
        });
    };

    public getView<T = V>(): T
    {
        return this.view as unknown as T;
    }

    public setParent<T extends Nestable<any>>(parent: T): void
    {
        super.setParent(parent);

        doc.emit('childAdded', parent, this);
    }

    public removeChild(component: Nestable<any>): void
    {
        super.removeChild(component);

        doc.emit('childRemoved', this, component);
    }

    protected onAddedToParent(): void
    {
        const parent = this.getParent<Component>();

        const { cloneInfo, cloneInfo: { isReferenceOrRoot } }  = parent;
        const cloner = cloneInfo.getCloner<Component>();

        if (cloner && isReferenceOrRoot)
        {
            if (parent.children.length !== cloner.children.length)
            {
                cloner.onClonedChildAdded(this as Component);
            }
        }
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected onRemovedFromParent(oldParent: Nestable)
    {
        const { cloneInfo, cloneInfo: { isReferenceOrRoot } } = this;
        const cloner = cloneInfo.getCloner<Component>();

        if (cloner && isReferenceOrRoot)
        {
            cloner.deleteSelf();
        }
        else
        {
            cloneInfo.forEachCloned<Component>((clonedComponent) =>
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

    public get values()
    {
        const values = this.model.values;

        const customProps = this.getCustomProps();

        for (const [key] of Object.entries(values))
        {
            const assignedProperty = customProps.getAssignedPropertyForModelKey(String(key));

            if (assignedProperty)
            {
                const assignedValue = assignedProperty.value;

                if (assignedValue !== undefined)
                {
                    values[key as keyof M] = assignedValue;
                }
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

    public setCustomProperty(customKey: string, type: CustomPropertyType, value: any): CustomProperty
    {
        const property = this.customProperties.set(this as Component, customKey, type, value);

        this.updateRecursiveWithClones();

        return property;
    }

    public removeCustomProperty(customKey: string)
    {
        this.customProperties.remove(this as Component, customKey);

        const modelKey = this.customProperties.getAssignedModelKeyForCustomKey(customKey);

        if (modelKey)
        {
            this.unAssignCustomProperty(modelKey as keyof M);
        }

        this.updateRecursiveWithClones();
    }

    public assignCustomProperty(modelKey: keyof M, customPropertyKey: string)
    {
        this.customProperties.assign(String(modelKey), customPropertyKey);

        const customProps = this.getCustomProps();

        this.customProperties.assignments.forEach((assignedCustomKey: string, assignedModelKey: string) =>
        {
            const array = customProps.properties.get(assignedCustomKey);

            if (assignedCustomKey === customPropertyKey && array && array.length === 0)
            {
                this.customProperties.assignments.delete(assignedModelKey);
            }
        });

        this.update();

        this.cloneInfo.forEachCloned<Component>((component) =>
        {
            if (component.cloneInfo.isDuplicate)
            {
                return;
            }

            if (!component.customProperties.hasAssignedToModelKey(String(modelKey)))
            {
                component.assignCustomProperty(modelKey, customPropertyKey);
            }
            component.update();
        });
    }

    public unAssignCustomProperty(modelKey: keyof M)
    {
        this.customProperties.unAssign(String(modelKey));

        this.update();

        this.cloneInfo.forEachCloned<Component>((component) =>
        {
            if (component.cloneInfo.isDuplicate)
            {
                return;
            }

            if (component.customProperties.hasAssignedToModelKey(String(modelKey)))
            {
                component.unAssignCustomProperty(modelKey);
            }
            component.update();
        });
    }

    public getAvailableCustomPropsAsArray(props: CustomProperty[] = [])
    {
        this.walk<Component>((component) =>
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

    public abstract modelSchema(): ModelSchema<M>;

    public abstract createView(): V;

    public abstract updateView(): void;
}

