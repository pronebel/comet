type Instance = {id: string};
const instances: Map<string, Instance> = new Map();
const idCounters: Map<string, number> = new Map();

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
}

export function unregisterInstance(instance: Instance)
{
    const { id } = instance;

    if (!instances.has(id))
    {
        throw new Error(`Instance "${id}" was already unregistered`);
    }

    instances.delete(id);
}

export function getInstance(id: string)
{
    if (!instances.has(id))
    {
        throw new Error(`Cannot access unregistered instance "${id}"`);
    }

    return instances.get(id);
}

export function clearInstances()
{
    idCounters.clear();
    instances.clear();
}
