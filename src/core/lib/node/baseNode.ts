import EventEmitter from 'eventemitter3';

export type BaseNodeEvents = 'childAdded' | 'childRemoved' | 'disposed';

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

export abstract class BaseNode<E extends string> extends EventEmitter<BaseNodeEvents | E>
{
    public parent?: BaseNode<any>;
    public children: BaseNode<any>[];

    constructor()
    {
        super();

        this.children = [];
    }

    public getNodeType(): string
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
            this.parent.removeChild(this);
            this.dispose();
        }
    }

    public getParent<T extends BaseNode<any>>()
    {
        return this.parent as unknown as T;
    }

    public getRoot<T extends BaseNode<any>>(): T
    {
        if (!this.parent)
        {
            return this as unknown as T;
        }

        let ref: BaseNode<any> | undefined = this.parent;

        while (ref)
        {
            ref = ref.parent;
        }

        return ref as unknown as T;
    }

    public setParent<T extends BaseNode<any>>(parent: T)
    {
        if (this.parent)
        {
            this.parent.removeChild(this);
        }

        this.parent = parent;

        parent.children.push(this);
        parent.emit('childAdded', this);

        this.onAddedToParent();
    }

    public addChild(component: BaseNode<any>)
    {
        if (component === this)
        {
            throw new Error(`"Cannot add ${this.getNodeType()} to self"`);
        }

        component.setParent(this);
    }

    public removeChild(component: BaseNode<any>)
    {
        const { children } = this;

        const index = children.indexOf(component);

        if (index > -1)
        {
            children.splice(index, 1);

            delete component.parent;

            this.emit('childRemoved', component);

            component.onRemovedFromParent(this);
        }
        else
        {
            throw new Error('"Cannot remove child which is not in parent"');
        }
    }

    public getChildAt<T extends BaseNode<any>>(index: number): T
    {
        return this.children[index] as T;
    }

    public forEach<T extends BaseNode<any>>(fn: (child: T, index: number, array: T[]) => void)
    {
        this.children.forEach((child, i, array) => fn(child as T, i, array as T[]));
    }

    public walk<T extends BaseNode<any>>(
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

    public containsChild<T extends BaseNode<any>>(component: T)
    {
        return this.children.indexOf(component) > -1;
    }

    protected onAddedToParent(): void
    {
        // subclasses
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected onRemovedFromParent(oldParent: BaseNode<any>)
    {
        // subclasses
    }
}

