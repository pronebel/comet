import type { ModelBase } from '../core/model/model';
import type { Command } from './command';
import { type AddChildCommandParams, AddChildCommand } from './commands/addChild';
import { type AssignCustomPropCommandParams, AssignCustomPropCommand } from './commands/assignCustomProp';
import { type CloneCommandParams, CloneCommand } from './commands/clone';
import { type CreateNodeCommandParams, CreateNodeCommand } from './commands/createNode';
import { type ModifyModelCommandParams, ModifyModelCommand } from './commands/modifyModel';
import { type RemoveChildCommandParams, RemoveChildCommand } from './commands/removeChild';
import { type RemoveCustomPropCommandParams, RemoveCustomPropCommand } from './commands/removeCustomProp';
import { type RemoveNodeCommandParams, RemoveNodeCommand } from './commands/removeNode';
import { type SetCustomPropCommandParams, SetCustomPropCommand } from './commands/setCustomProp';
import { type SetParentCommandParams, SetParentCommand } from './commands/setParent';
import { type UnAssignCustomPropCommandParams, UnAssignCustomPropCommand } from './commands/unassignCustomProp';
import { type UnlinkCommandParams, UnlinkCommand } from './commands/unlink';

export type CommandName =
    'AssignCustomProp' |
    'Clone' |
    'AddChild' |
    'CreateNode' |
    'ModifyModel' |
    'RemoveChild' |
    'RemoveCustomProp' |
    'RemoveNode' |
    'RestoreNode' |
    'SetCustomProp' |
    'SetParent' |
    'UnAssignCustomProp' |
    'Unlink';

export const Commands
= {
    AssignCustomProp: AssignCustomPropCommand,
    Clone: CloneCommand,
    AddChild: AddChildCommand,
    CreateNode: CreateNodeCommand,
    ModifyModel: ModifyModelCommand,
    RemoveChild: RemoveChildCommand,
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
    AddChild: AddChildCommandParams<ModelBase>;
    CreateNode: CreateNodeCommandParams<ModelBase>;
    ModifyModel: ModifyModelCommandParams<ModelBase>;
    RemoveChild: RemoveChildCommandParams;
    RemoveCustomProp: RemoveCustomPropCommandParams;
    RemoveNode: RemoveNodeCommandParams;
    SetCustomProp: SetCustomPropCommandParams;
    SetParent: SetParentCommandParams;
    UnAssignCustomProp: UnAssignCustomPropCommandParams;
    Unlink: UnlinkCommandParams;
}

export function createCommand<
    K extends keyof typeof Commands, P extends CommandParams[K],
>(commandJSON: any)
{
    const commandName = commandJSON.name as K;
    const params = commandJSON.params as P;

    const CommandClass = Commands[commandName] as {
        new (params: P): Command;
    };

    const command = new CommandClass(params);

    command.cache = commandJSON.cache;
    command.isUndoRoot = commandJSON.isUndoRoot;

    return command;
}
