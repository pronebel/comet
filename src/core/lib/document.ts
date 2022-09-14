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

export class Document extends EventEmitter<'modified'>
{
    public enableCommands: boolean;

    public static instance: Document;

    constructor(enableCommands = true)
    {
        super();

        if (!Document.instance)
        {
            Document.instance = this;
        }

        this.enableCommands = enableCommands;
    }

    public onConstruct(id: string, componentType: string, modelValues: object, cloneMode: CloneMode)
    {
        this.enableCommands && this.emit('modified', new ConstructCommand(id, componentType, modelValues, cloneMode));
    }

    public onClone(clonerId: string, clonedId: string, cloneMode: CloneMode, depth: number)
    {
        this.enableCommands && this.emit('modified', new CloneCommand(clonerId, clonedId, cloneMode, depth));
    }

    public onModifyModel(id: string, key: string, value: any, oldValue: any)
    {
        this.enableCommands && this.emit('modified', new ModifyModelCommand(id, key, value, oldValue));
    }

    public onAddChild(parentId: string, childId: string)
    {
        this.enableCommands && this.emit('modified', new AddChildCommand(parentId, childId));
    }

    public onRemoveChild(parentId: string, childId: string)
    {
        this.enableCommands && this.emit('modified', new RemoveChildCommand(parentId, childId));
    }

    public onUnlink(id: string, unlinkChildren: boolean)
    {
        this.enableCommands && this.emit('modified', new UnlinkCommand(id, unlinkChildren));
    }

    public onDelete(id: string)
    {
        this.enableCommands && this.emit('modified', new DeleteCommand(id));
    }

    public onSetCustomProp(id: string, creatorId: string, name: string, type: CustomPropertyType, value: any)
    {
        this.enableCommands && this.emit('modified', new SetCustomPropCommand(id, creatorId, name, type, value));
    }

    public onRemoveCustomProp(id: string, customKey: string)
    {
        this.enableCommands && this.emit('modified', new RemoveCustomPropCommand(id, customKey));
    }

    public onAssignCustomProp(id: string, modelKey: string, customKey: string)
    {
        this.enableCommands && this.emit('modified', new AssignCustomPropCommand(id, modelKey, customKey));
    }

    public onUnAssignCustomProp(id: string, modelKey: string)
    {
        this.enableCommands && this.emit('modified', new UnAssignCustomPropCommand(id, modelKey));
    }
}

export const doc = () => Document.instance;
