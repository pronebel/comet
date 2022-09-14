import EventEmitter from 'eventemitter3';

import { AddChildCommand } from './commands/addChild';
import { AssignCustomPropCommand } from './commands/assignCustomProp';
import { CloneCommand } from './commands/clone';
import { ConstructCommand } from './commands/construct';
import { DeleteCommand } from './commands/delete';
import { ModifyModelCommand } from './commands/modifyModel';
import { RemoveChildCommand } from './commands/removeChild';
import { RemoveCustomPropCommand } from './commands/removeCustomProp';
import { SetCustomPropCommand } from './commands/setCustomProp';
import { UnAssignCustomPropCommand } from './commands/unassignCustomProp';
import { UnlinkCommand } from './commands/unlink';
import type { CloneMode } from './node/cloneInfo';
import type { CustomPropertyType } from './node/customProperties';

export class Sync extends EventEmitter<'modified'>
{
    public enableCommands: boolean;

    constructor(enableCommands = true)
    {
        super();

        this.enableCommands = enableCommands;
    }

    public construct(id: string, componentType: string, modelValues: object, cloneMode: CloneMode)
    {
        this.enableCommands && this.emit('modified', new ConstructCommand(id, componentType, modelValues, cloneMode));
    }

    public clone(clonerId: string, clonedId: string, cloneMode: CloneMode, depth: number)
    {
        this.enableCommands && this.emit('modified', new CloneCommand(clonerId, clonedId, cloneMode, depth));
    }

    public modelChanged(id: string, key: string, value: any, oldValue: any)
    {
        this.enableCommands && this.emit('modified', new ModifyModelCommand(id, key, value, oldValue));
    }

    public childAdded(parentId: string, childId: string)
    {
        this.enableCommands && this.emit('modified', new AddChildCommand(parentId, childId));
    }

    public childRemoved(parentId: string, childId: string)
    {
        this.enableCommands && this.emit('modified', new RemoveChildCommand(parentId, childId));
    }

    public unlink(id: string, unlinkChildren: boolean)
    {
        this.enableCommands && this.emit('modified', new UnlinkCommand(id, unlinkChildren));
    }

    public deleted(id: string)
    {
        this.enableCommands && this.emit('modified', new DeleteCommand(id));
    }

    public setCustomProp(id: string, creatorId: string, name: string, type: CustomPropertyType, value: any)
    {
        this.enableCommands && this.emit('modified', new SetCustomPropCommand(id, creatorId, name, type, value));
    }

    public removeCustomProp(id: string, customKey: string)
    {
        this.enableCommands && this.emit('modified', new RemoveCustomPropCommand(id, customKey));
    }

    public assignCustomProp(id: string, modelKey: string, customKey: string)
    {
        this.enableCommands && this.emit('modified', new AssignCustomPropCommand(id, modelKey, customKey));
    }

    public unAssignCustomProp(id: string, modelKey: string)
    {
        this.enableCommands && this.emit('modified', new UnAssignCustomPropCommand(id, modelKey));
    }
}
