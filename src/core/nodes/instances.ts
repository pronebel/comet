import { getUserName } from '../../editor/sync/user';

type Instance = { id: string };

const instances: Map<string, Instance> = new Map();
const idCounters: Map<string, number> = new Map();

const userName = getUserName();

export function peekNextIdCount(type: string)
{
    if (!idCounters.has(type))
    {
        return 1;
    }

    return idCounters.get(type) as number + 1;
}

export function newId(nodeType: string)
{
    const id = peekNextIdCount(nodeType);

    idCounters.set(nodeType, id);

    return `${nodeType}:${id}`;
}

export function parseId(id: string)
{
    const [type, idCounter] = id.split(':');

    return {
        type,
        idCounter: parseInt(idCounter, 10),
    };
}

export function consolidateId(id: string)
{
    const { type, idCounter } = parseId(id);

    const counterValue = idCounters.get(type);

    idCounters.set(
        type,
        Math.max(
            idCounter,
            counterValue === undefined ? 1 : counterValue,
        ));
}

export function registerInstance(instance: Instance)
{
    const { id } = instance;

    if (instances.has(id))
    {
        throw new Error(`Instance "${id}" already registered`);
    }

    instances.set(id, instance);
    consolidateId(id);

    console.log(`${userName}:registered instance "${id}"`);
}

export function unregisterInstance(instance: Instance)
{
    const { id } = instance;

    if (!instances.has(id))
    {
        throw new Error(`Instance "${id}" was already unregistered`);
    }

    instances.delete(id);

    console.log(`${userName}:unregistered instance "${id}"`);
}

export function getInstance<T>(id: string): T
{
    if (!instances.has(id))
    {
        throw new Error(`Cannot access unregistered instance "${id}"`);
    }

    return instances.get(id) as unknown as T;
}

export function hasInstance(id: string): boolean
{
    return instances.has(id);
}

export function clearInstances()
{
    idCounters.clear();
    instances.clear();
}

export function getLatestInstance<T>(compareFn: (a: any, b: any) => number): T
{
    return Array.from(instances.values()).sort(compareFn).pop() as unknown as T;
}

export function getInstancesByType()
{
    const types: Record<string, string[]> = {};

    for (const [id, instance] of instances.entries())
    {
        const { type } = parseId(id);

        if (!types[type])
        {
            types[type] = [];
        }

        types[type].push(instance.id);
    }

    return types;
}

(window as any).getInstance = getInstance;
