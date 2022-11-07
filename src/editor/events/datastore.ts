import type { ModelValue } from '../../core/model/model';
import type { CustomPropertyType, CustomPropertyValueType } from '../../core/nodes/customProperties';
import type { CloneInfoSchema } from '../../core/nodes/schema';

interface BaseEvent
{
    nodeId: string;
}

export interface DatastoreNodeEvent {
    'datastore.node.created': BaseEvent;
    'datastore.node.hydrated': BaseEvent;
    'datastore.node.removed': BaseEvent & {
        parentId?: string;
    };
    'datastore.node.parent.set': BaseEvent & {
        parentId: string;
    };
    'datastore.node.customProp.defined': BaseEvent & {
        customKey: string;
        type: CustomPropertyType;
        value: CustomPropertyValueType;
    };
    'datastore.node.customProp.undefined': BaseEvent & {
        customKey: string;
    };
    'datastore.node.customProp.assigned': BaseEvent & {
        modelKey: string;
        customKey: string;
    };
    'datastore.node.customProp.unassigned': BaseEvent & {
        modelKey: string;
    }
    'datastore.node.model.modified': BaseEvent & {
        key: string | null; // undefined means whole object was set, which will be .value
        value: ModelValue;
    };
    'datastore.node.cloneInfo.modified': BaseEvent & CloneInfoSchema;
};