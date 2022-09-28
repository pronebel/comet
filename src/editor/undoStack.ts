import type { AbstractCommand } from './abstractCommand';

export default class UndoStack
{
    public stack: AbstractCommand[];
    public head: number;

    constructor()
    {
        this.stack = [];
        this.head = -1;
    }

    public push(command: AbstractCommand)
    {
        const { stack, head } = this;

        if (head > -1 && head < stack.length - 1)
        {
            // if we have undone and there are commands past the head, delete them
            const deleteCount = stack.length - 1 - head;

            stack.splice(head + 1, deleteCount);
        }

        stack.push(command);
        this.head++;
        this.debugPrint();
    }

    public undo()
    {
        const peek = this.peek();

        if (peek === null || !peek.canUndo)
        {
            console.log(`Cannot undo. Stack length = ${this.stack.length}`);

            return;
        }

        this.head--;
        peek.undo();

        this.debugPrint();
    }

    public redo()
    {
        this.head++;
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

    protected peek(): AbstractCommand | null
    {
        const { stack } = this;

        return stack.length ? stack[this.stack.length - 1] : null;
    }

    public toJSON(): object[]
    {
        return this.stack.flat().map((cmd) => cmd.toJSON());
    }

    public debugPrint()
    {
        const { head, stack } = this;
        const array = stack.map((command, i) =>
        {
            if (i === head)
            {
                return ['--->', command];
            }

            return [command];
        }).flat();

        console.log(`head: ${head}`, array);
    }
}
