import type { AbstractCommand } from './abstractCommand';
import { createCommand } from './commandFactory';
// import { getUserName } from './sync/user';

// const userName = getUserName();

export default class UndoStack
{
    public stack: (AbstractCommand[] | AbstractCommand)[];
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

    public push(command: AbstractCommand)
    {
        this.stack.push(command);
        this.head++;

        // console.log(`%c${userName}:Command<${command.name}>: ${command.toString()}`, 'color:yellow');
    }

    // public pushCommands(commands: AbstractCommand[])
    // {
    //     this.stack.push(commands);
    //     this.head += commands.length;

    //     commands.forEach((command) =>
    //     {
    //         // console.log(`%c${userName}:Command<${command.name}>: ${command.toString()}`, 'color:yellow');
    //         command.exec();
    //     });
    // }

    public toJSON(endIndex = 0): object[]
    {
        return this.stack.flat().slice(0, endIndex === 0 ? undefined : endIndex).map((cmd) => cmd.toJSON());
    }

    public fromJSON(json: any[])
    {
        this.stack.length = 0;

        json.forEach((params) =>
        {
            const name = params.$;
            const command = createCommand(name, params);

            this.push(command);
        });
    }
}
