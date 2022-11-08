import type { Command } from '../core/command';

interface CommandPayload
{
    command: Command;
}

export interface CommandEvent
{
    'command.exec': CommandPayload;
    'command.undo': CommandPayload;
    'command.redo': CommandPayload;
}
