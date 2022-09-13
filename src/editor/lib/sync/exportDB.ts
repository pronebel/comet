import type * as Y from 'yjs';

import type { Database } from './database';

export function exportDB(database: Database)
{
    const json: Record<string, any> = {
        projects: {},
    };

    const projects = database.getProjectsMap();

    Array.from(projects.keys()).forEach((key) =>
    {
        const project = projects.get(key) as Y.Map<unknown>;

        json.projects[key] = exportProject(project);
    });

    return json;
}

function exportProject(project: Y.Map<unknown>)
{
    const meta = project.get('meta') as Y.Map<unknown>;
    const subDoc = project.get('doc') as Y.Doc;

    subDoc.load();
    console.log(subDoc);
    subDoc.whenLoaded.then(() =>
    {
        console.log('!');
    });

    // const test = subDoc.get('test') as Y.Map<unknown>;

    // console.log(test.get('foo'));

    const json: Record<string, any> = {
        name: meta.get('name'),
        version: meta.get('version'),
    };

    return json;
}
