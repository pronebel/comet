import type { CloneMode } from '../../../core/lib/nodes/cloneInfo';
import type { CustomPropertyType } from '../../../core/lib/nodes/customProperties';
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

export class Sync
{
    public construct(id: string, componentType: string, modelValues: object, cloneMode: CloneMode)
    {
        return new ConstructCommand(id, componentType, modelValues, cloneMode);
    }

    public clone(clonerId: string, clonedId: string, cloneMode: CloneMode, depth: number)
    {
        return new CloneCommand(clonerId, clonedId, cloneMode, depth);
    }

    public modelChanged(id: string, key: string, value: any, oldValue: any)
    {
        return new ModifyModelCommand(id, key, value, oldValue);
    }

    public childAdded(parentId: string, childId: string)
    {
        return new AddChildCommand(parentId, childId);
    }

    public childRemoved(parentId: string, childId: string)
    {
        return new RemoveChildCommand(parentId, childId);
    }

    public unlink(id: string, unlinkChildren: boolean)
    {
        return new UnlinkCommand(id, unlinkChildren);
    }

    public deleted(id: string)
    {
        return new DeleteCommand(id);
    }

    public setCustomProp(id: string, creatorId: string, name: string, type: CustomPropertyType, value: any)
    {
        return new SetCustomPropCommand(id, creatorId, name, type, value);
    }

    public removeCustomProp(id: string, customKey: string)
    {
        return new RemoveCustomPropCommand(id, customKey);
    }

    public assignCustomProp(id: string, modelKey: string, customKey: string)
    {
        return new AssignCustomPropCommand(id, modelKey, customKey);
    }

    public unAssignCustomProp(id: string, modelKey: string)
    {
        return new UnAssignCustomPropCommand(id, modelKey);
    }
}
