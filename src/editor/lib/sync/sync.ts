import EventEmitter from 'eventemitter3';

import type { CloneMode } from '../../../core/lib/node/cloneInfo';
import type { CustomPropertyType } from '../../../core/lib/node/customProperties';
import type { SyncAdapter } from '../../../core/lib/syncAdapter';
import { AddChildCommand } from '../commands/addChild';
import { AssignCustomPropCommand } from '../commands/assignCustomProp';
import { CloneCommand } from '../commands/clone';
import { ConstructCommand } from '../commands/construct';
import { DeleteCommand } from '../commands/delete';
import { ModifyModelCommand } from '../commands/modifyModel';
import { RemoveChildCommand } from '../commands/removeChild';
import { RemoveCustomPropCommand } from '../commands/removeCustomProp';
import { SetCustomPropCommand } from '../commands/setCustomProp';
import { UnAssignCustomPropCommand } from '../commands/unassignCustomProp';
import { UnlinkCommand } from '../commands/unlink';

export class Sync extends EventEmitter<'sync'> implements SyncAdapter
{
    public construct(id: string, componentType: string, modelValues: object, cloneMode: CloneMode)
    {
        this.emit('sync', new ConstructCommand(id, componentType, modelValues, cloneMode));
    }

    public clone(clonerId: string, clonedId: string, cloneMode: CloneMode, depth: number)
    {
        this.emit('sync', new CloneCommand(clonerId, clonedId, cloneMode, depth));
    }

    public modelChanged(id: string, key: string, value: any, oldValue: any)
    {
        this.emit('sync', new ModifyModelCommand(id, key, value, oldValue));
    }

    public childAdded(parentId: string, childId: string)
    {
        this.emit('sync', new AddChildCommand(parentId, childId));
    }

    public childRemoved(parentId: string, childId: string)
    {
        this.emit('sync', new RemoveChildCommand(parentId, childId));
    }

    public unlink(id: string, unlinkChildren: boolean)
    {
        this.emit('sync', new UnlinkCommand(id, unlinkChildren));
    }

    public deleted(id: string)
    {
        this.emit('sync', new DeleteCommand(id));
    }

    public setCustomProp(id: string, creatorId: string, name: string, type: CustomPropertyType, value: any)
    {
        this.emit('sync', new SetCustomPropCommand(id, creatorId, name, type, value));
    }

    public removeCustomProp(id: string, customKey: string)
    {
        this.emit('sync', new RemoveCustomPropCommand(id, customKey));
    }

    public assignCustomProp(id: string, modelKey: string, customKey: string)
    {
        this.emit('sync', new AssignCustomPropCommand(id, modelKey, customKey));
    }

    public unAssignCustomProp(id: string, modelKey: string)
    {
        this.emit('sync', new UnAssignCustomPropCommand(id, modelKey));
    }
}
