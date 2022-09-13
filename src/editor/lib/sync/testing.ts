import { connectAnonymously } from '@convergence/convergence';
import { v4 } from 'uuid';
import { WebsocketProvider } from 'y-websocket';
import * as Y from 'yjs';

document.body.innerHTML = `<button id="write">Write</button><br/><button id="read">Read</button>`;
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
document.getElementById('write')!.onclick = write;
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
document.getElementById('read')!.onclick = read;

const count = 1000000;
const chunkSize = 1000;

const doc = new Y.Doc();

console.log('?', doc.getSubdocs());

let hasRun = false;

const wsProvider = new WebsocketProvider(
    SYNC_SERVER,
    'comet',
    doc,
);

function patchEmitter(label: string, emitter: any)
{
    const oldEmit = emitter.emit;

    emitter.emit = (eventName: string, ...args: any[]) =>
    {
        console.log(`${label}:${eventName}`, args);
        oldEmit.apply(emitter, [eventName, ...args]);
    };
}

patchEmitter('wsProvider', wsProvider);
patchEmitter('doc', doc);

wsProvider.on('status', (event: any) =>
{
    console.log('status', event.status, wsProvider.synced);
});

wsProvider.on('sync', (isSynced: boolean) =>
{
    console.log('syncd', isSynced);

    if (hasRun)
    {
        console.log('hasRun!');

        return;
    }

    // write();
    // read();
    // write();

    hasRun = true;
});

function write2()
{
    console.log('write start', count / chunkSize);

    for (let i = 0; i < count / chunkSize; i += 1)
    {
        console.log('@', i);

        // eslint-disable-next-line no-loop-func
        doc.transact(() =>
        {
            for (let j = i; j < Math.min(count, i + chunkSize); j++)
            {
                const uuid = v4();

                const key = `Property:${String((i * chunkSize) + (j - i))}`;

                console.log('write', key);
                doc.getMap('data').set(key, `${uuid}-${uuid}`);
            }
        });
    }

    console.log('write end');
}

function read2()
{
    console.log('read start');
    const pairs = [];

    const data = doc.getMap('data');
    const keys = Array.from(data.keys());

    data.observe(() =>
    {
        console.log('!!');
    });

    console.log(`${keys.length} keys found`);

    for (const key of data.keys())
    {
        pairs.push([key, data.get(key)]);
    }

    console.log('read end', pairs);
}

function write()
{
    console.log('Write');

    const folder = doc.getMap();

    const subDoc = new Y.Doc();

    folder.set('my-document.txt', subDoc);
    subDoc.getText().insert(0, 'some initial content');
}

function read()
{
    console.log('Read');

    const subDoc = doc.getMap().get('my-document.txt') as Y.Doc;

    subDoc.load();

    console.log(subDoc);

    subDoc.whenLoaded.then(() => { debugger; });

    const subDocText = subDoc.getText();

    subDocText.observe(() =>
    {
        console.log('text', subDocText.toString());
    });
}
