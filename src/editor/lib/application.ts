import { EventEmitter } from 'eventemitter3';

import { ProjectNode } from '../../core/lib/node/types/project';

export class Application extends EventEmitter
{
    public project: ProjectNode;

    constructor()
    {
        super();

        this.project = new ProjectNode();
    }
}
