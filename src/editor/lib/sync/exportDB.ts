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
        const project = projects.get(key) as Y.Doc;

        project.load();

        json.projects[key] = exportProject(project);
    });

    return json;
}

function exportProject(project: Y.Doc)
{
    const meta = project.getMap('meta');

    console.log(meta.toJSON());

    meta.observe(() => console.log('!'));

    const json: Record<string, any> = {
        name: meta.get('name'),
        version: meta.get('version'),
    };

    return json;
}
