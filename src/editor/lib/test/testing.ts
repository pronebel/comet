import { DataStore } from '../sync/datastore';

document.body.innerHTML = `<button id="connect">Connect</button><button id="disconnect">Disconnect</button>`;

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
document.getElementById('connect')!.onclick = () =>
{
    const datastore = new DataStore();

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    document.getElementById('disconnect')!.onclick = () => datastore.disconnect();

    datastore.connect().then((domain) =>
    {
        console.log('Connection success', domain);

        domain.activities().join('project', 'some-project-id', {
            autoCreate: {
                ephemeral: true,
                worldPermissions: ['join', 'view_state', 'set_state'],
            },
        }).then((activity) =>
        {
        // interact with the activity.
            console.log('Joined activity', activity);
        });
    })
        .catch((error) =>
        {
            console.log('Connection failure', error);
        });
};
