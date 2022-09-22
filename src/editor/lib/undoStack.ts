import type { Command } from './commands';
// import { getUserName } from './sync/user';

// const userName = getUserName();

export default class UndoStack
{
    public stack: (Command[] | Command)[];
    public head: number;

    constructor()
    {
        this.stack = [];
        this.head = -1;
    }

    public get hasCommands()
    {
        return this.head > -1;
    }

    public pushCommand<T = void>(command: Command): T
    {
        this.stack.push(command);
        this.head++;

        // console.log(`%c${userName}:Command<${command.name}>: ${command.toString()}`, 'color:yellow');

        return command.apply() as T;
    }

    public pushCommands(commands: Command[])
    {
        this.stack.push(commands);
        this.head += commands.length;

        commands.forEach((command) =>
        {
            // console.log(`%c${userName}:Command<${command.name}>: ${command.toString()}`, 'color:yellow');
            command.apply();
        });
    }

    public toJSON(): object[]
    {
        return this.stack.flat().map((cmd) => cmd.toJSON());
    }

    public fromJSON(json: object[])
    {
        json.forEach((params) =>
        {

        });
    }
}
