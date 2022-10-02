import type { ModelValue } from '../../core/model/model';
import type { CustomPropertyType, CustomPropertyValueType } from '../../core/nodes/customProperties';
import type { CloneInfoSchema } from '../../core/nodes/schema';

export type DatastoreEvents =
| 'nodeCreated'
| 'nodeRemoved'
| 'parentSet'
| 'customPropDefined'
| 'customPropUndefined'
| 'customPropAssigned'
| 'customPropUnassigned'
| 'modelModified'
| 'cloneInfoModified';

export interface DSNodeEvent
{
    nodeId: string;
}

export type DSNodeCreatedEvent = DSNodeEvent;

export interface DSNodeRemovedEvent extends DSNodeEvent
{
    parentId?: string;
}

export interface DSParentSetEvent extends DSNodeEvent
{
    parentId: string;
}

export interface DSCustomPropDefinedEvent extends DSNodeEvent
{
    customKey: string;
    type: CustomPropertyType;
    value: CustomPropertyValueType;
}

export interface DSCustomPropUndefinedEvent extends DSNodeEvent
{
    customKey: string;
}

export interface DSCustomPropAssignedEvent extends DSNodeEvent
{
    modelKey: string;
    customKey: string;
}

export interface DSCustomPropUnassignedEvent extends DSNodeEvent
{
    modelKey: string;
}

export interface DSModelModifiedEvent extends DSNodeEvent
{
    key: string | null; // undefined means whole object was set, which will be .value
    value: ModelValue;
}

export type DSCloneInfoModifiedEvent = DSNodeEvent & CloneInfoSchema;

