const url = new URL(window.location.href);
const params = new URLSearchParams(url.search);

export function getUrlParam<T = string>(key: string): T | null
{
    const val = params.get(key);

    if (val)
    {
        try
        {
            return JSON.parse(val) as T;
        }
        catch (e)
        {
            return val as T;
        }
    }

    return null;
}

export function hasUrlParam(key: string)
{
    return params.get(key) !== null;
}
