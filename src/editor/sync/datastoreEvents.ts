import type { ModelValue } from '../../core/model/model';
import type { CustomPropertyType, CustomPropertyValueType } from '../../core/nodes/customProperties';
import type { CloneInfoSchema } from '../../core/nodes/schema';

export interface DSNodeEventBase
{
    nodeId: string;
}

export type DSNodeCreatedEvent = DSNodeEventBase;

export interface DSNodeRemovedEvent extends DSNodeEventBase
{
    parentId?: string;
}

export interface DSParentSetEvent extends DSNodeEventBase
{
    parentId: string;
}

export interface DSCustomPropDefinedEvent extends DSNodeEventBase
{
    customKey: string;
    type: CustomPropertyType;
    value: CustomPropertyValueType;
}

export interface DSCustomPropUndefinedEvent extends DSNodeEventBase
{
    customKey: string;
}

export interface DSCustomPropAssignedEvent extends DSNodeEventBase
{
    modelKey: string;
    customKey: string;
}

export interface DSCustomPropUnassignedEvent extends DSNodeEventBase
{
    modelKey: string;
}

export interface DSModelModifiedEvent extends DSNodeEventBase
{
    key: string | null; // undefined means whole object was set, which will be .value
    value: ModelValue;
}

export type DSCloneInfoModifiedEvent = DSNodeEventBase & CloneInfoSchema;
