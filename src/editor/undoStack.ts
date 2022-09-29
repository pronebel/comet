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

    public get length()
    {
        return this.stack.length;
    }

    public push(command: AbstractCommand)
    {
        const { stack, head } = this;

        if (head >= -1 && head < stack.length - 1)
        {
            // if we have undone and there are commands past the head, delete them
            const deleteCount = stack.length - 1 - head;

            stack.splice(head + 1, deleteCount);
        }

        stack.push(command);
        this.head++;
    }

    public undo()
    {
        const { stack, head, nextUndoRootIndex } = this;

        if (stack.length === 0 || head === -1)
        {
            return;
        }

        const headStart = head;

        for (let i = headStart; i >= nextUndoRootIndex; i--)
        {
            const cmd = stack[i];

            cmd.undo();
        }

        this.head = nextUndoRootIndex - 1;
    }

    public redo()
    {
        const { stack, head, nextRedoRootIndex } = this;

        if (head === stack.length - 1 || stack.length === 0)
        {
            return;
        }

        const headStart = nextRedoRootIndex;

        for (let i = headStart; i < stack.length; i++)
        {
            const cmd = stack[i];

            if (cmd.isUndoRoot && i > headStart)
            {
                break;
            }

            this.head = i;

            cmd.redo();
        }
    }

    public get nextUndoRootIndex()
    {
        const { head, stack } = this;

        for (let i = head; i >= 0; i--)
        {
            if (stack[i].isUndoRoot)
            {
                return i;
            }
        }

        return head;
    }

    public get nextRedoRootIndex()
    {
        const { head, stack } = this;

        for (let i = head + 1; i < stack.length; i++)
        {
            if (stack[i].isUndoRoot)
            {
                return i;
            }
        }

        return stack.length - 1;
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

    protected get peek(): AbstractCommand | null
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
            const cmdName = `[${i}]:${command.name}`;
            const cmd = command.isUndoRoot ? [`✅${cmdName}`] : [cmdName];

            if (i === head)
            {
                return [`<b style="color:white">${cmd}</b>`];
            }

            return cmd;
        }).flat(5);

        return `@${head}~${array.join(' / ')}`;
    }
}
