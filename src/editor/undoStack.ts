import type { AbstractCommand } from './abstractCommand';

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

    public clear()
    {
        this.stack.length = 0;
        this.head = -1;
    }

    public push(command: AbstractCommand)
    {
        this.stack.push(command);
        this.head++;
    }

    public toJSON(): object[]
    {
        return this.stack.flat().map((cmd) => cmd.toJSON());
    }
}
