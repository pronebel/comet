import EventEmitter from 'eventemitter3';

export type NestableEvents = 'childAdded' | 'childRemoved' | 'disposed';

export interface WalkOptions
{
    includeSelf?: boolean;
    depth: number;
    cancel: boolean;
    direction: 'up' | 'down';
}

export const defaultWalkOptions: WalkOptions = {
    includeSelf: true,
    depth: 0,
    cancel: false,
    direction: 'down',
};

export abstract class Nestable<E extends string = NestableEvents> extends EventEmitter<NestableEvents | E>
{
    public parent?: Nestable;
    public children: Nestable[];

    constructor()
    {
        super();

        this.children = [];
    }

    public getComponentType(): string
    {
        return (Object.getPrototypeOf(this).constructor as {
            new (): object;
        }).name;
    }

    public dispose()
    {
        // subclass
    }

    public deleteSelf()
    {
        if (this.parent)
        {
            this.parent.removeChild(this as Nestable);
            this.dispose();
        }
    }

    public getParent<T extends Nestable<any>>()
    {
        return this.parent as unknown as T;
    }

    public getRoot<T extends Nestable<any>>(): T
    {
        if (!this.parent)
        {
            return this as unknown as T;
        }

        let ref: Nestable | undefined = this.parent;

        while (ref)
        {
            ref = ref.parent;
        }

        return ref as unknown as T;
    }

    public setParent<T extends Nestable<any>>(parent: T)
    {
        if (this.parent)
        {
            this.parent.removeChild(this as Nestable);
        }

        this.parent = parent;

        parent.children.push(this as Nestable);
        parent.emit('childAdded', this);

        this.onAddedToParent();
    }

    public addChild(component: Nestable<any>)
    {
        if (component === this)
        {
            throw new Error(`"Cannot add ${this.getComponentType()} to self"`);
        }

        component.setParent(this as Nestable);
    }

    public removeChild(component: Nestable<any>)
    {
        const { children } = this;

        const index = children.indexOf(component);

        if (index > -1)
        {
            children.splice(index, 1);

            delete component.parent;

            this.emit('childRemoved', component);

            component.onRemovedFromParent(this as Nestable);
        }
        else
        {
            throw new Error('"Cannot remove child which is not in parent"');
        }
    }

    public getChildAt<T extends Nestable<any>>(index: number): T
    {
        return this.children[index] as T;
    }

    public walk<T extends Nestable<any>>(
        fn: (component: T, options: WalkOptions) => void,
        options: Partial<WalkOptions> = {},
    )
    {
        const currentOptions = {
            ...defaultWalkOptions,
            ...options,
        };
        const { includeSelf, depth, direction, cancel } = currentOptions;

        if (cancel)
        {
            return;
        }

        if (includeSelf)
        {
            fn(this as unknown as T, currentOptions);
        }

        if (direction === 'down')
        {
            this.children.forEach((child) =>
                child.walk(fn, {
                    ...currentOptions,
                    depth: depth + 1,
                    includeSelf: true,
                }),
            );
        }
        else
        if (this.parent)
        {
            this.parent.walk(fn, {
                ...currentOptions,
                depth: depth - 1,
                includeSelf: true,
            });
        }
    }

    public containsChild<T extends Nestable<any>>(component: T)
    {
        return this.children.indexOf(component as unknown as Nestable) > -1;
    }

    protected onAddedToParent(): void
    {
        // subclasses
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected onRemovedFromParent(oldParent: Nestable<any>)
    {
        // subclasses
    }
}

