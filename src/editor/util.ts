const url = new URL(window.location.href);
const params = new URLSearchParams(url.search);

export function getUrlParam(key: string)
{
    return params.get(key);
}

export function hasUrlParam(key: string)
{
    return params.get(key) !== null;
}
