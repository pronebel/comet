import type { ModelValue } from '../../core/model/model';
import type { CustomPropertyType, CustomPropertyValueType } from '../../core/nodes/customProperties';
import type { CloneInfoSchema, TextureAssetSchema } from '../../core/nodes/schema';

interface BaseDatastoreEvent
{
    nodeId: string;
}

export interface DatastoreNodeEvent
{
    'datastore.node.created': BaseDatastoreEvent;
    'datastore.node.hydrated': BaseDatastoreEvent;
    'datastore.node.removed': BaseDatastoreEvent & {
        parentId?: string;
    };
    'datastore.node.parent.set': BaseDatastoreEvent & {
        parentId: string;
    };
    'datastore.node.customProp.defined': BaseDatastoreEvent & {
        customKey: string;
        type: CustomPropertyType;
        value: CustomPropertyValueType;
    };
    'datastore.node.customProp.undefined': BaseDatastoreEvent & {
        customKey: string;
    };
    'datastore.node.customProp.assigned': BaseDatastoreEvent & {
        modelKey: string;
        customKey: string;
    };
    'datastore.node.customProp.unassigned': BaseDatastoreEvent & {
        modelKey: string;
    };
    'datastore.node.model.modified': BaseDatastoreEvent & {
        key: string | null; // undefined means whole object was set, which will be .value
        value: ModelValue;
    };
    'datastore.node.cloneInfo.modified': BaseDatastoreEvent & CloneInfoSchema;
    'datastore.texture.created': {id: string} & TextureAssetSchema;
}
