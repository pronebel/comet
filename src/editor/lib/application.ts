import { EventEmitter } from 'eventemitter3';

import { Project } from '../../core/lib/project';

export class Application extends EventEmitter
{
    public project: Project;

    constructor()
    {
        super();

        this.project = new Project();
    }
}
