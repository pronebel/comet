import type { Command } from './commands';
import { getUserName } from './sync/user';

const userName = getUserName();

export default class UndoStack
{
    public undoStack: (Command[] | Command)[];
    public head: number;

    constructor()
    {
        this.undoStack = [];
        this.head = -1;
    }

    public get hasCommands()
    {
        return this.head > -1;
    }

    public pushCommand<T = void>(command: Command): T
    {
        this.undoStack.push(command);
        this.head++;

        // console.log(`%c${userName}:Command<${command.name()}>: ${command.toString()}`, 'color:yellow');

        return command.apply() as T;
    }

    public pushCommands(commands: Command[])
    {
        this.undoStack.push(commands);
        this.head += commands.length;

        commands.forEach((command) =>
        {
            console.log(`%c${userName}:Command<${command.name()}>: ${command.toString()}`, 'color:yellow');
            command.apply();
        });
    }
}
