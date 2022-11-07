export type DatastoreNodeEvent = 
| 'datastore.node.created'
| 'datastore.node.hydrated'
| 'datastore.node.removed'
| 'datastore.node.parent.set'
| 'datastore.node.customProp.defined'
| 'datastore.node.customProp.undefined'
| 'datastore.node.customProp.assigned'
| 'datastore.node.customProp.unassigned'
| 'datastore.node.model.modified'
| 'datastore.node.cloneInfo.modified';

export type DatastoreEvent = DatastoreNodeEvent;

// todo: key value with event type? standardise way to define?

// type Foo = {
//     'a': {
//         x: number;
//     }
// }

// type K = keyof Foo;
// type V<S extends K> = Foo[S];

// const a: K = 'a';
// const b: V<'a'> = {x:1};

export interface DSNodeEventBase
{
    nodeId: string;
}

export type DatastoreNodeEvents = {
    'datastore.node.created': DSNodeEventBase;
    'datastore.node.hydrated': DSNodeEventBase;
    'datastore.node.removed': DSNodeEventBase & {
        parentId: string;
    }
}

export type Foo = {
    'datastore2': DSNodeEventBase;
}

type Keys = keyof DatastoreNodeEvents | keyof Foo;

const k: Keys = 'datastore2';
const v: Foo['datastore2']= {nodeId: 2};