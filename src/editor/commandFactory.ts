import type { ModelBase } from '../core/model/model';
import type { AbstractCommand } from './abstractCommand';
import { type AssignCustomPropCommandParams, AssignCustomPropCommand } from './commands/assignCustomProp';
import { type CloneCommandParams, CloneCommand } from './commands/clone';
import { type CreateNodeCommandParams, CreateNodeCommand } from './commands/createNode';
import { type ModifyModelCommandParams, ModifyModelCommand } from './commands/modifyModel';
import { type RemoveCustomPropCommandParams, RemoveCustomPropCommand } from './commands/removeCustomProp';
import { type RemoveNodeCommandParams, RemoveNodeCommand } from './commands/removeNode';
import { type SetCustomPropCommandParams, SetCustomPropCommand } from './commands/setCustomProp';
import { type SetParentCommandParams, SetParentCommand } from './commands/setParent';
import { type UnAssignCustomPropCommandParams, UnAssignCustomPropCommand } from './commands/unassignCustomProp';
import { type UnlinkCommandParams, UnlinkCommand } from './commands/unlink';

export type CommandName =
    'AssignCustomProp' |
    'Clone' |
    'CreateNode' |
    'ModifyModel' |
    'RemoveCustomProp' |
    'RemoveNode' |
    'SetCustomProp' |
    'SetParent' |
    'UnAssignCustomProp' |
    'Unlink';

export const Commands
= {
    AssignCustomProp: AssignCustomPropCommand,
    Clone: CloneCommand,
    CreateNode: CreateNodeCommand,
    ModifyModel: ModifyModelCommand,
    RemoveCustomProp: RemoveCustomPropCommand,
    RemoveNode: RemoveNodeCommand,
    SetCustomProp: SetCustomPropCommand,
    SetParent: SetParentCommand,
    UnAssignCustomProp: UnAssignCustomPropCommand,
    Unlink: UnlinkCommand,
};

export interface CommandParams
{
    AssignCustomProp: AssignCustomPropCommandParams;
    Clone: CloneCommandParams;
    CreateNode: CreateNodeCommandParams<ModelBase>;
    ModifyModel: ModifyModelCommandParams<ModelBase>;
    RemoveCustomProp: RemoveCustomPropCommandParams;
    RemoveNode: RemoveNodeCommandParams;
    SetCustomProp: SetCustomPropCommandParams;
    SetParent: SetParentCommandParams;
    UnAssignCustomProp: UnAssignCustomPropCommandParams;
    Unlink: UnlinkCommandParams;
}

export function createCommand<
    K extends keyof typeof Commands, P extends CommandParams[K],
>(commandName: K, params: P)
{
    const CommandClass = Commands[commandName] as {
        new (params: P): AbstractCommand;
    };

    return new CommandClass(params);
}
