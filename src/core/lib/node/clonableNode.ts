import type { id } from '../../../editor/lib/sync/schema';
import { Document } from '../document';
import type { Model, ModelBase } from '../model/model';
import { createModel } from '../model/model';
import type { ModelSchema } from '../model/schema';
import type { BaseNodeEvents } from './baseNode';
import { BaseNode } from './baseNode';
import type { Clonable } from './cloneInfo';
import { CloneInfo, CloneMode } from './cloneInfo';
import type { CustomProperty, CustomPropertyType } from './customProperties';
import { CustomProperties } from './customProperties';

export type ClonableNodeEvents = BaseNodeEvents | 'modelChanged' | 'unlinked';

export type AnyNode = ClonableNode<any, any, any>;

const modelBase = {} as ModelBase;

export const nodesById: Map<id, AnyNode> = new Map();

export abstract class ClonableNode<
    M extends ModelBase = typeof modelBase,
    V extends object = object,
    E extends string = ClonableNodeEvents,
> extends BaseNode<ClonableNodeEvents | E> implements Clonable
{
    public model: Model<M> & M;
    public view: V;

    public cloneInfo: CloneInfo;
    public customProperties: CustomProperties<ClonableNode>;

    constructor(
        modelValues: Partial<M> = {},
        cloneInfo: CloneInfo = new CloneInfo(),
    )
    {
        super();

        nodesById.set(this.id, this);

        this.cloneInfo = cloneInfo;

        const cloner = this.cloneInfo.getCloner<ClonableNode>();

        if (cloner && cloneInfo.isReference)
        {
            this.model = cloner.model as unknown as Model<M> & M;
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

        this.doc.sync.construct(this.id, this.getNodeType(), modelValues, cloneInfo.cloneMode);

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

        const cloner = cloneInfo.getCloner<ClonableNode>();

        if (cloner)
        {
            cloner.cloneInfo.cloned.push(this);

            const sourceModel = cloner.model as unknown as Model<M>;

            // note: Reference case is handled immediately in Node constructor as model is shared

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

    public clone<T extends ClonableNode>(cloneMode: CloneMode = CloneMode.Variant, depth = 0): T
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

        this.doc.sync.modelChanged(this.id, component.id, cloneMode, depth);

        this.forEach<ClonableNode>((child) =>
        {
            const childNode = (child).clone(cloneMode, depth + 1);

            childNode.setParent(component);
        });

        component.onCloned();

        return component;
    }

    public onCloned()
    {
        const { cloneInfo, cloneInfo: { isDuplicate } } = this;
        const cloner = cloneInfo.getCloner<ClonableNode>();

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
        this.walk<ClonableNode>((component) =>
        {
            const componentCloner = component.cloneInfo.getCloner<ClonableNode>();

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
        const cloner = cloneInfo.getCloner<ClonableNode>();

        if (cloner)
        {
            if ((model.parent && isVariant) || isReferenceRoot)
            {
                model.flatten();
            }
            else if (isReference)
            {
                this.model = cloner.model.clone() as unknown as Model<M> & M;

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

            this.doc.sync.unlink(this.id, unlinkChildren);

            this.update();
        }

        if (unlinkChildren)
        {
            this.forEach<ClonableNode>((child) => child.unlink());
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

        this.cloneInfo.forEachCloned<ClonableNode>((component) => component.unlink());

        this.children.forEach((child) =>
        {
            child.dispose();
        });

        this.removeAllListeners();
    }

    public deleteSelf(): void
    {
        super.deleteSelf();

        this.doc.sync.deleted(this.id);
    }

    public update(recursive = false)
    {
        if (this.view)
        {
            this.updateView();
        }

        if (recursive)
        {
            this.forEach<ClonableNode>((child) => child.update(true));
        }
    }

    public updateRecursive()
    {
        return this.update(true);
    }

    public updateRecursiveWithClones()
    {
        this.walk<ClonableNode>((component) =>
        {
            component.update();

            component.cloneInfo.forEachCloned<ClonableNode>((cloned) => cloned.updateRecursiveWithClones());
        });
    }

    protected onModelModified = <T>(key: string, value: T, oldValue: T) =>
    {
        this.update();

        this.emit('modelChanged', key, value, oldValue);

        this.doc.sync.modelChanged(this.id, key, value, oldValue);
    };

    protected onClonerChildAdded = (component: ClonableNode) =>
    {
        const { cloneMode } = this.cloneInfo;

        const copy = component.clone(
            cloneMode === CloneMode.ReferenceRoot ? CloneMode.Reference : cloneMode,
            1,
        );

        this.addChild(copy);
    };

    protected onClonedChildAdded = (component: ClonableNode) =>
    {
        const copy = component.clone(
            CloneMode.Reference,
            1,
        );

        copy.parent = this;
        this.children.push(copy);

        copy.onAddedToParent();

        this.doc.sync.childAdded(this.id, copy.id);
    };

    protected onClonerChildRemoved = (component: ClonableNode) =>
    {
        this.forEach<ClonableNode>((child) =>
        {
            if ((child).cloneInfo.isClonedFrom(component))
            {
                this.doc.sync.childRemoved(this.id, child.id);

                child.deleteSelf();
            }
        });
    };

    public getView<T = V>(): T
    {
        return this.view as unknown as T;
    }

    public setParent<T extends BaseNode<any>>(parent: T): void
    {
        super.setParent(parent);

        this.doc.sync.childAdded((parent as unknown as ClonableNode).id, this.id);
    }

    public removeChild(component: BaseNode<any>): void
    {
        super.removeChild(component);

        this.doc.sync.childRemoved(this.id, (component as unknown as ClonableNode).id);
    }

    protected onAddedToParent(): void
    {
        const parent = this.getParent<ClonableNode>();

        const { cloneInfo, cloneInfo: { isReferenceOrRoot } }  = parent;
        const cloner = cloneInfo.getCloner<ClonableNode>();

        if (cloner && isReferenceOrRoot)
        {
            if (parent.children.length !== cloner.children.length)
            {
                cloner.onClonedChildAdded(this as unknown as ClonableNode);
            }
        }
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected onRemovedFromParent(oldParent: BaseNode)
    {
        const { cloneInfo, cloneInfo: { isReferenceOrRoot } } = this;
        const cloner = cloneInfo.getCloner<ClonableNode>();

        if (cloner && isReferenceOrRoot)
        {
            cloner.deleteSelf();
        }
        else
        {
            cloneInfo.forEachCloned<ClonableNode>((clonedNode) =>
            {
                const { cloneInfo: { cloner, isReferenceOrRoot } } = clonedNode;

                const isSameNode = cloner === this;

                if (isSameNode && isReferenceOrRoot)
                {
                    clonedNode.deleteSelf();
                }
            });
        }
    }

    public get doc()
    {
        return Document.instance;
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

    public get(modelKey: keyof M): M[keyof M]
    {
        return this.model.getValue(modelKey);
    }

    public set<K extends keyof M>(modelKey: K, value: M[K])
    {
        this.model.setValue(modelKey, value);
    }

    public setCustomProperty(customKey: string, type: CustomPropertyType, value: any): CustomProperty
    {
        const property = this.customProperties.set(this as unknown as ClonableNode, customKey, type, value);

        this.updateRecursiveWithClones();

        this.doc.sync.setCustomProp(this.id, property.creator.id, property.name, property.type, property.value);

        return property;
    }

    public removeCustomProperty(customKey: string)
    {
        this.customProperties.remove(this as unknown as ClonableNode, customKey);

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

        this.doc.sync.assignCustomProp(this.id, String(modelKey), customPropertyKey);

        this.cloneInfo.forEachCloned<ClonableNode>((component) =>
        {
            if (component.cloneInfo.isDuplicate)
            {
                return;
            }

            if (!component.customProperties.hasAssignedToModelKey(String(modelKey)))
            {
                component.assignCustomProperty(String(modelKey), customPropertyKey);
            }
            component.update();
        });
    }

    public unAssignCustomProperty(modelKey: keyof M)
    {
        this.customProperties.unAssign(String(modelKey));

        this.update();

        this.doc.sync.unAssignCustomProp(this.id, String(modelKey));

        this.cloneInfo.forEachCloned<ClonableNode>((component) =>
        {
            if (component.cloneInfo.isDuplicate)
            {
                return;
            }

            if (component.customProperties.hasAssignedToModelKey(String(modelKey)))
            {
                component.unAssignCustomProperty(String(modelKey));
            }
            component.update();
        });
    }

    public getAvailableCustomPropsAsArray(props: CustomProperty[] = [])
    {
        this.walk<ClonableNode>((component) =>
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
