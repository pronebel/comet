import { EventEmitter } from 'eventemitter3';
import { WebsocketProvider } from 'y-websocket';
import * as Y from 'yjs';

export type DatabaseEvents = 'connect' | 'disconnect' | 'awarenessChange';

export class Database extends EventEmitter<DatabaseEvents>
{
    public doc: Y.Doc;
    public wsProvider: WebsocketProvider;
    public awareness: any; // where is this type?

    constructor()
    {
        super();

        const doc = this.doc = new Y.Doc();

        const wsProvider = this.wsProvider = new WebsocketProvider(
            SYNC_SERVER,
            'comet',
            doc,
        );

        wsProvider.on('status', (event: any) =>
        {
            console.log('status', event.status);
            if (event.status === 'connected')
            {
                this.emit('connect');
            }
            else
            {
                this.emit('disconnect');
            }
        });

        const awareness = this.awareness = wsProvider.awareness;

        awareness.on('change', (changes: any) =>
        {
            console.log('Awareness change', changes);
            this.emit('awarenessChange', changes);
        });
    }

    public setAwarenessProperty(key: string, value: object)
    {
        this.awareness.setLocalStateField(key, value);
    }

    public clear()
    {
        this.doc.getMap().delete('comet');
    }

    public install()
    {
        this.doc.getMap().set('comet', new Y.Doc());
    }

    public getCometMap()
    {
        return this.doc.getMap().get('comet') as Y.Doc;
    }

    public getProjectsMap()
    {
        return this.getCometMap().getMap('projects');
    }

    public createProject(projectName: string)
    {
        const project = new Y.Doc();

        this.getProjectsMap().set(projectName, project);
        const meta = project.getMap('meta');

        meta.set('name', projectName);
        meta.set('version', APP_VERSION);
    }
}
