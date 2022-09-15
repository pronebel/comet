export function getUserName()
{
    const url = new URL(window.location.href);
    const params = new URLSearchParams(url.search);
    const user = params.get('user');

    if (!user)
    {
        return 'ali';
        // throw new Error('Missing "?user=" query parameter');
    }

    return user;
}
