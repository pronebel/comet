import type { Model } from './model/model';
import { createModel } from './model/model';
import type { ModelSchema } from './model/schema';
import type { NestableEvents } from './nestable';
import { Nestable } from './nestable';
import { project } from './project';
import { SpawnInfo, SpawnMode } from './spawn';

const ids = {} as Record<string, number>;

export type AnyComponent = Component<any, any>;

// todo: this might need to be extended by subclasses, may need to be generic parameter
export type ComponentEvents = NestableEvents | 'modified' | 'unlinked';

export abstract class Component<M extends object, V> extends Nestable<ComponentEvents>
{
    public model: Model<M> & M;
    public view: V;

    public spawnInfo: SpawnInfo<Component<M, V>>;

    public id: string;

    constructor(
        modelValues: Partial<M> = {},
        spawnInfo: SpawnInfo<Component<M, V>> = new SpawnInfo<Component<M, V>>(),
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

        this.spawnInfo = spawnInfo;

        const { spawner } = this.spawnInfo;

        if (spawner && spawnInfo.isReference)
        {
            this.model = spawner.model;
        }
        else
        {
            const schema = this.modelSchema();

            this.model = createModel(schema, {
                ...modelValues,
            });
        }

        this.initModel();

        this.initSpawning();

        this.view = this.createView();

        this.update();
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

    public copy<T extends Component<M, V>>(spawnMode: SpawnMode = SpawnMode.Variant, isRoot = true): T
    {
        const Ctor = Object.getPrototypeOf(this).constructor as {
            new (modelValues: Partial<M>, spawnInfo?: SpawnInfo<Component<M, V>>): T;
        };

        const component = new Ctor(
            {},
            new SpawnInfo(spawnMode === SpawnMode.Reference && isRoot ? SpawnMode.ReferenceRoot : spawnMode, this),
        );

        this.children.forEach((child) =>
        {
            const childComponent = (child as AnyComponent).copy(spawnMode, false);

            childComponent.setParent(component as Nestable);
        });

        return component as unknown as T;
    }

    protected initSpawning()
    {
        const { spawner, spawnMode } = this.spawnInfo;

        if (spawner)
        {
            spawner.spawnInfo.spawned.push(this);

            const { model: sourceModel } = spawner;

            if (spawnMode === SpawnMode.Variant || spawnMode === SpawnMode.ReferenceRoot)
            {
                this.model.link(sourceModel);

                if (spawnMode === SpawnMode.ReferenceRoot)
                {
                    spawner.model.isReference = true;
                    this.model.isReference = true;
                }
            }
            else if (spawnMode === SpawnMode.Duplicate)
            {
                const sourceValues = sourceModel.values;

                this.model.setValues(sourceValues);
            }

            spawner.on('childAdded', this.onSpawnerChildAdded);
            spawner.on('childRemoved', this.onSpawnerChildRemoved);
        }
    }

    protected onSpawnerChildAdded = (component: AnyComponent) =>
    {
        const { spawnMode } = this.spawnInfo;

        const copy = component.copy(
            spawnMode === SpawnMode.ReferenceRoot ? SpawnMode.Reference : spawnMode,
            false,
        );

        this.addChild(copy as Nestable);
    };

    protected onSpawnedChildAdded = (component: AnyComponent) =>
    {
        const copy = component.copy(
            SpawnMode.Reference,
            false,
        );

        copy.parent = this as Nestable;
        this.children.push(copy as Nestable);

        copy.onAddedToParent();
    };

    protected onSpawnerChildRemoved = (component: AnyComponent) =>
    {
        this.children.forEach((child) =>
        {
            if ((child as AnyComponent).spawnInfo.isSpawner(component))
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

        if (this.spawnInfo.wasSpawned)
        {
            this.unlink();
        }

        this.emit('disposed');

        this.spawnInfo.spawned.forEach((component) => component.unlink());

        this.children.forEach((child) =>
        {
            child.dispose();
        });
    }

    public unlink(unlinkChildren = true)
    {
        const { model, spawnInfo: { spawner, isVariant, isReference, isReferenceRoot } } = this;

        if (spawner)
        {
            if ((model.parent && isVariant) || isReferenceRoot)
            {
                model.flatten();
            }
            else if (isReference)
            {
                this.model = spawner.model.copy();

                this.initModel();
            }

            spawner.off('childAdded', this.onSpawnerChildAdded);
            spawner.off('childRemoved', this.onSpawnerChildRemoved);

            this.spawnInfo.unlink();

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

        const { spawnInfo: { spawner, isReferenceOrRoot } }  = parent;

        if (spawner && isReferenceOrRoot)
        {
            if (parent.children.length !== spawner.children.length)
            {
                spawner.onSpawnedChildAdded(this);
            }
        }
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected onRemovedFromParent(oldParent: Nestable)
    {
        const { spawnInfo: { spawner, isReferenceOrRoot, spawned } } = this;

        if (spawner && isReferenceOrRoot)
        {
            spawner.deleteSelf();
        }
        else
        {
            spawned.forEach((spawnedComponent) =>
            {
                const { spawnInfo: { spawner, isReferenceOrRoot } } = spawnedComponent;

                const isSameComponent = spawner === this;

                if (isSameComponent && isReferenceOrRoot)
                {
                    spawnedComponent.deleteSelf();
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

    public getCustomPropertyValueForKey(customPropertyName: string): any
    {
        let value = this.model.customProperties.get(customPropertyName) || project.customProperties.get(customPropertyName);

        if (value === undefined)
        {
            this.walk<AnyComponent>((parent, options) =>
            {
                if (parent.model.customProperties.has(customPropertyName))
                {
                    value = parent.model.customProperties.get(customPropertyName);
                    options.cancel = true;
                }
            }, { direction: 'up', includeSelf: false });
        }

        return value;
    }

    public assignCustomProperty(modelKey: keyof M, customPropertyName: string)
    {
        this.model.assignCustomProperty(this, modelKey, customPropertyName);
    }

    public unAssignCustomProperty(modelKey: keyof M)
    {
        this.model.unassignCustomProperty(modelKey);
    }

    public abstract modelSchema(): ModelSchema<M>;

    public abstract createView(): V;

    public abstract updateView(): void;
}
