import type { Application } from './application';
import type { Command, CommandSchema } from './core/command';
import type { UndoStackEvent } from './core/undoStack';
import type {
    DatastoreEvent,
    DSCloneInfoModifiedEvent,
    DSCustomPropAssignedEvent,
    DSCustomPropDefinedEvent,
    DSCustomPropUnassignedEvent,
    DSCustomPropUndefinedEvent,
    DSModelModifiedEvent,
    DSNodeCreatedEvent,
    DSNodeEvent,
    DSNodeRemovedEvent,
    DSParentSetEvent,
} from './sync/datastoreEvents';

export type DSEventEntry = {
    type: 'dsEvent';
    name: DatastoreEvent;
    event: DSNodeEvent;
};

export type CommandEntry = {
    type: 'command';
    mode: UndoStackEvent;
    command: CommandSchema;
};

export type DiagnosticsEntry = CommandEntry | DSEventEntry;

export const diagnostics: DiagnosticsEntry[] = [];

function logDSEvent(name: DatastoreEvent, event: DSNodeEvent)
{
    diagnostics.push({
        type: 'dsEvent',
        name,
        event,
    });
}

function logCommand(mode: UndoStackEvent, command: Command)
{
    diagnostics.push({
        type: 'command',
        mode,
        command: command.toJSON(),
    });
}

export function initDiagnostics(app: Application)
{
    app.datastore
        .on('nodeCreated', (e: DSNodeCreatedEvent) => logDSEvent('nodeCreated', e))
        .on('nodeRemoved', (e: DSNodeRemovedEvent) => logDSEvent('nodeRemoved', e))
        .on('parentSet', (e: DSParentSetEvent) => logDSEvent('parentSet', e))
        .on('customPropDefined', (e: DSCustomPropDefinedEvent) => logDSEvent('customPropDefined', e))
        .on('customPropUndefined', (e: DSCustomPropUndefinedEvent) => logDSEvent('customPropUndefined', e))
        .on('customPropAssigned', (e: DSCustomPropAssignedEvent) => logDSEvent('customPropAssigned', e))
        .on('customPropUnassigned', (e: DSCustomPropUnassignedEvent) => logDSEvent('customPropUnassigned', e))
        .on('modelModified', (e: DSModelModifiedEvent) => logDSEvent('modelModified', e))
        .on('cloneInfoModified', (e: DSCloneInfoModifiedEvent) => logDSEvent('cloneInfoModified', e));

    app.undoStack
        .on('push', (cmd: Command) => logCommand('push', cmd))
        .on('undo', (cmd: Command) => logCommand('undo', cmd))
        .on('redo', (cmd: Command) => logCommand('redo', cmd));
}
