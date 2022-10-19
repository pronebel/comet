const keyMap: Map<string, boolean> = new Map();

window.addEventListener('keydown', (e: KeyboardEvent) =>
{
    const { key } = e;

    keyMap.set(key, true);

    console.log('keydown', key);
});

window.addEventListener('keyup', (e: KeyboardEvent) =>
{
    const { key } = e;

    keyMap.set(key, false);

    console.log('keyup', key);
});

export function isKeyPressed(key: string)
{
    if (!keyMap.has(key))
    {
        return false;
    }

    return keyMap.get(key) as boolean;
}
