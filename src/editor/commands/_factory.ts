import { AssignCustomPropCommand } from './assignCustomProp';
import { CloneCommand } from './clone';
import { CreateNodeCommand } from './createNode';
import { ModifyModelCommand } from './modifyModel';
import { RemoveCustomPropCommand } from './removeCustomProp';
import { RemoveNodeCommand } from './removeNode';
import { SetCustomPropCommand } from './setCustomProp';
import { SetParentCommand } from './setParent';
import { UnAssignCustomPropCommand } from './unassignCustomProp';
import { UnlinkCommand } from './unlink';

export function createCommand(name: string, params: any)
{
    if (name === AssignCustomPropCommand.commandName)
    {
        return new AssignCustomPropCommand(params);
    }
    else if (name === CloneCommand.commandName)
    {
        return new CloneCommand(params);
    }
    else if (name === CreateNodeCommand.commandName)
    {
        return new CreateNodeCommand(params);
    }
    else if (name === ModifyModelCommand.commandName)
    {
        return new ModifyModelCommand(params);
    }
    else if (name === RemoveCustomPropCommand.commandName)
    {
        return new RemoveCustomPropCommand(params);
    }
    else if (name === RemoveNodeCommand.commandName)
    {
        return new RemoveNodeCommand(params);
    }
    else if (name === SetCustomPropCommand.commandName)
    {
        return new SetCustomPropCommand(params);
    }
    else if (name === SetParentCommand.commandName)
    {
        return new SetParentCommand(params);
    }
    else if (name === UnAssignCustomPropCommand.commandName)
    {
        return new UnAssignCustomPropCommand(params);
    }
    else if (name === UnlinkCommand.commandName)
    {
        return new UnlinkCommand(params);
    }
    throw new Error(`Unknown command "${name}"`);
}
