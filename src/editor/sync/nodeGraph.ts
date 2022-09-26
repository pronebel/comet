import type { Datastore } from './datastore';
import type {
    DSCloneInfoModifiedEvent,
    DSCustomPropAssignedEvent,
    DSCustomPropDefinedEvent,
    DSCustomPropUnassignedEvent,
    DSCustomPropUndefinedEvent,
    DSModelModifiedEvent,
    DSNodeCreatedEvent,
    DSNodeRemovedEvent,
    DSParentSetEvent,
} from './datastoreEvents';
import { getUserName } from './user';

const userName = getUserName();

export class NodeGraph
{
    constructor(public readonly datastore: Datastore)
    {
        datastore
            .on('nodeCreated', this.onNodeCreated)
            .on('nodeRemoved', this.onNodeRemoved)
            .on('parentSet', this.onParentSet)
            .on('customPropDefined', this.onCustomPropDefined)
            .on('customPropUndefined', this.onCustomPropUndefined)
            .on('customPropAssigned', this.onCustomPropAssigned)
            .on('customPropUnassigned', this.onCustomPropUnassigned)
            .on('modelModified', this.onModelModified)
            .on('cloneInfoModified', this.onCloneInfoModified);
    }

    protected log(event: any)
    {
        console.log(`%c${userName}:NodeCreated: ${JSON.stringify(event)}`, 'color:yellow');
    }

    protected onNodeCreated(event: DSNodeCreatedEvent)
    {
        this.log(event);
    }

    protected onNodeRemoved(event: DSNodeRemovedEvent)
    {
        this.log(event);
    }

    protected onParentSet(event: DSParentSetEvent)
    {
        this.log(event);
    }

    protected onCustomPropDefined(event: DSCustomPropDefinedEvent)
    {
        this.log(event);
    }

    protected onCustomPropUndefined(event: DSCustomPropUndefinedEvent)
    {
        this.log(event);
    }

    protected onCustomPropAssigned(event: DSCustomPropAssignedEvent)
    {
        this.log(event);
    }

    protected onCustomPropUnassigned(event: DSCustomPropUnassignedEvent)
    {
        this.log(event);
    }

    protected onModelModified(event: DSModelModifiedEvent)
    {
        this.log(event);
    }

    protected onCloneInfoModified(event: DSCloneInfoModifiedEvent)
    {
        this.log(event);
    }
}
