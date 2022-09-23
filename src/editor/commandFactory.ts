import type { ModelBase } from '../core/model/model';
import type { AbstractCommand } from './command';
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

export enum Command
// eslint-disable-next-line @typescript-eslint/indent
{
    AssignCustomProp,
    Clone,
    CreateNode,
    ModifyModel,
    RemoveCustomProp,
    RemoveNode,
    SetCustomProp,
    SetParent,
    UnAssignCustomProp,
    Unlink,
}

export const Commands
= {
    [Command.AssignCustomProp]: AssignCustomPropCommand,
    [Command.Clone]: CloneCommand,
    [Command.CreateNode]: CreateNodeCommand,
    [Command.ModifyModel]: ModifyModelCommand,
    [Command.RemoveCustomProp]: RemoveCustomPropCommand,
    [Command.RemoveNode]: RemoveNodeCommand,
    [Command.SetCustomProp]: SetCustomPropCommand,
    [Command.SetParent]: SetParentCommand,
    [Command.UnAssignCustomProp]: UnAssignCustomPropCommand,
    [Command.Unlink]: UnlinkCommand,
};

export interface CommandParams
{
    [Command.AssignCustomProp]: AssignCustomPropCommandParams;
    [Command.Clone]: CloneCommandParams;
    [Command.CreateNode]: CreateNodeCommandParams<ModelBase>;
    [Command.ModifyModel]: ModifyModelCommandParams<ModelBase>;
    [Command.RemoveCustomProp]: RemoveCustomPropCommandParams;
    [Command.RemoveNode]: RemoveNodeCommandParams;
    [Command.SetCustomProp]: SetCustomPropCommandParams;
    [Command.SetParent]: SetParentCommandParams;
    [Command.UnAssignCustomProp]: UnAssignCustomPropCommandParams;
    [Command.Unlink]: UnlinkCommandParams;
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

createCommand(Command.Unlink, { nodeId: 'foo' });
