import type { Command } from '../core/command';

export interface CommandEvent
{
    'command.exec': {
        command: Command;
    };
}
