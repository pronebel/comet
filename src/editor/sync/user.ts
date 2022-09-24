import { getUrlParam } from '../util';

export function getUserName()
{
    const user = getUrlParam('user');

    if (!user)
    {
        return 'ali';
        // throw new Error('Missing "?user=" query parameter');
    }

    return user;
}
