import type EventEmitter from 'eventemitter3';

import type { CloneMode } from './node/cloneInfo';
import type { CustomPropertyType } from './node/customProperties';

export interface SyncAdapterCommands
{
    construct: (id: string, componentType: string, modelValues: object, cloneMode: CloneMode) => void;

    clone: (clonerId: string, clonedId: string, cloneMode: CloneMode, depth: number) => void;

    modelChanged: (id: string, key: string, value: any, oldValue: any) => void;

    childAdded: (parentId: string, childId: string) => void;

    childRemoved: (parentId: string, childId: string) => void;

    unlink: (id: string, unlinkChildren: boolean) => void;

    deleted: (id: string) => void;

    setCustomProp: (id: string, creatorId: string, name: string, type: CustomPropertyType, value: any) => void;

    removeCustomProp: (id: string, customKey: string) => void;

    assignCustomProp: (id: string, modelKey: string, customKey: string) => void;

    unAssignCustomProp: (id: string, modelKey: string) => void;
}

export type SyncAdapter = SyncAdapterCommands & EventEmitter<'sync'>;
