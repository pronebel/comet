import type { NodeSchema } from '../core/nodes/schema';
import { Application } from './application';
import type { CommandName } from './commandFactory';

// 'graphOnly' = update just the nodes in the node graph (usually for updates from remote users where datastore is already modified)
// 'full' = update both the graph nodes and the datastore (usually for local modifications)
export type UpdateMode = 'graphOnly' | 'full';

export type NodeTargetCommand = { params: { nodeId: string } };

export abstract class AbstractCommand<ParamsType extends {} = {}, ReturnType = void, CacheType extends {} = {}>
{
    public cache: CacheType;
    public isUndoRoot: boolean;
    public hasRun: boolean;

    constructor(public readonly params: ParamsType)
    {
        this.cache = {} as CacheType;
        this.isUndoRoot = false;
        this.hasRun = false;
    }

    public static commandName = 'Untitled';

    public abstract apply(): ReturnType;
    public abstract undo(): void;

    public get name(): CommandName
    {
        return (Object.getPrototypeOf(this).constructor as {commandName: string}).commandName as CommandName;
    }

    public get isAtomic()
    {
        // whether or not this command ends up in undoStack (true),
        // or whether it just does something outside of the stack (false) such as orchestrating other commands
        return true;
    }

    public get index(): number
    {
        return this.app.undoStack.indexOf(this);
    }

    public run(): ReturnType
    {
        const result = this.apply();

        this.hasRun = true;

        return result as unknown as ReturnType;
    }

    // protected updateNextRedoCommandsWithNodeId(nodeId: string)
    // {
    //     const nextCommands = this.app.undoStack.nextRedoCommands.commands;

    //     for (const command of nextCommands)
    //     {
    //         if (command === this)
    //         {
    //             continue;
    //         }

    //         (command as unknown as NodeTargetCommand).params.nodeId = nodeId;
    //     }
    // }

    protected updateAllFollowingCommands(updateFn: (command: AbstractCommand) => void)
    {
        const { index, app } = this;

        for (let i = index; i < app.undoStack.length; i++)
        {
            const command = app.undoStack.getCommandAt(i);

            if (command)
            {
                updateFn(command);
            }
        }
    }

    protected castParamsAs<T>()
    {
        return this.params as unknown as T;
    }

    public updateNodeId(oldNodeId: string, newNodeId: string)
    {
        const { params } = this;

        const withNodeIdParams = this.castParamsAs<{nodeId: string}>();
        const withParentIdParams = this.castParamsAs<{parentId: string}>();
        const withNodeSchemaParams = this.castParamsAs<{nodeSchema: NodeSchema}>();

        if ('nodeId' in params && (withNodeIdParams).nodeId === oldNodeId)
        {
            withNodeIdParams.nodeId = newNodeId;
        }
        if ('parentId' in params && (withParentIdParams).parentId === oldNodeId)
        {
            withParentIdParams.parentId = newNodeId;
        }
        if ('nodeSchema' in params && (withNodeSchemaParams).nodeSchema.id === oldNodeId)
        {
            withNodeSchemaParams.nodeSchema.id = newNodeId;
        }
        if ('nodeSchema' in params && (withNodeSchemaParams).nodeSchema.parent === oldNodeId)
        {
            withNodeSchemaParams.nodeSchema.parent = newNodeId;
        }
    }

    public redo()
    {
        return this.apply();
    }

    public get app()
    {
        return Application.instance;
    }

    public get datastore()
    {
        return this.app.datastore;
    }

    public toJSON()
    {
        return {
            $: this.name,
            ...this.params,
        };
    }
}
