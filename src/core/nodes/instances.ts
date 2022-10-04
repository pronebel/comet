import { getUserName } from '../../editor/sync/user';

type Instance = { id: string };

const instances: Map<string, Instance> = new Map();
const trash: Map<string, Instance> = new Map();
const idCounters: Map<string, number> = new Map();

const userName = getUserName();
const logStyle = 'color:PaleTurquoise';
const logId = `${userName}:INSTS`;

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
        throw new Error(`${userName}:Instance "${id}" already registered`);
    }

    instances.set(id, instance);
    consolidateId(id);

    console.log(`%c${logId}:registered instance "${id}"`, logStyle);
}

export function unregisterInstance(instance: Instance)
{
    const { id } = instance;

    if (!instances.has(id))
    {
        throw new Error(`${userName}:Instance "${id}" was already unregistered`);
    }

    instances.delete(id);

    console.log(`%c${logId}:unregistered instance "${id}"`, logStyle);
}

export function moveToTrash(instance: Instance)
{
    const { id } = instance;

    if (trash.has(id))
    {
        throw new Error(`${userName}:Trash already contains instance "${id}"`);
    }

    console.log(`%c${logId}:moving to trash "${id}"`, logStyle);

    instances.delete(id);
    trash.set(id, instance);
}

export function isInstanceInTrash(id: string)
{
    return trash.has(id);
}

export function restoreInstance<T>(id: string): T
{
    if (!trash.has(id))
    {
        throw new Error(`${logId}:Trash does not contain instance "${id}"`);
    }

    if (instances.has(id))
    {
        throw new Error(`${logId}:Instance "${id}" already out of trash`);
    }

    const instance = trash.get(id) as Instance;

    console.log(`%c${logId}:restoring instance "${id}"`, logStyle);

    trash.delete(id);
    instances.set(id, instance);

    return instance as unknown as T;
}

export function getInstance<T>(id: string): T
{
    if (!instances.has(id))
    {
        throw new Error(`${logId}:Cannot access unregistered instance "${id}"`);
    }

    return instances.get(id) as unknown as T;
}

export function getTrashInstance<T>(id: string): T
{
    if (!trash.has(id))
    {
        throw new Error(`${logId}:Trash does not contains instance "${id}"`);
    }

    return trash.get(id) as unknown as T;
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

export function getTrashInstancesByType()
{
    const types: Record<string, string[]> = {};

    for (const [id, instance] of trash.entries())
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
(window as any).getTrashInstance = getTrashInstance;
