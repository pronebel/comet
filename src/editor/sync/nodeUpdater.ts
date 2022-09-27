import { getGraphNode } from '../../core/nodes/nodeFactory';
import { CreateNodeCommand } from '../commands/createNode';
import { RemoveNodeCommand } from '../commands/removeNode';
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

export class NodeUpdater
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

    protected log(eventName: string, event: any)
    {
        console.log(`%c${userName}:${eventName} ${JSON.stringify(event)}`, 'color:yellow');
    }

    protected onNodeCreated = (event: DSNodeCreatedEvent) =>
    {
        this.log('onNodeCreated', event);

        const nodeSchema = this.datastore.getNodeSchema(event.nodeId);

        new CreateNodeCommand({ nodeSchema, isNewNode: false }).exec();
    };

    protected onNodeRemoved = (event: DSNodeRemovedEvent) =>
    {
        this.log('onNodeRemoved', event);

        const nodeId = event.nodeId;

        new RemoveNodeCommand({ nodeId, isRemoteUpdate: true }).exec();
    };

    protected onParentSet = (event: DSParentSetEvent) =>
    {
        this.log('onParentSet', event);

        const { nodeId, parentId } = event;

        // update graph node
        const parentNode = getGraphNode(parentId);
        const childNode = getGraphNode(nodeId);

        parentNode.addChild(childNode);
    };

    protected onCustomPropDefined = (event: DSCustomPropDefinedEvent) =>
    {
        this.log('onCustomPropDefined', event);
    };

    protected onCustomPropUndefined = (event: DSCustomPropUndefinedEvent) =>
    {
        this.log('onCustomPropUndefined', event);
    };

    protected onCustomPropAssigned = (event: DSCustomPropAssignedEvent) =>
    {
        this.log('onCustomPropAssigned', event);
    };

    protected onCustomPropUnassigned = (event: DSCustomPropUnassignedEvent) =>
    {
        this.log('onCustomPropUnassigned', event);
    };

    protected onModelModified = (event: DSModelModifiedEvent) =>
    {
        this.log('onModelModified', event);

        const { key, nodeId, value } = event;

        const node = getGraphNode(nodeId);

        if (key === undefined)
        {
            node.model.setValues(value as object);
        }
        else
        {
            node.model.setValue(key, value);
        }
    };

    protected onCloneInfoModified = (event: DSCloneInfoModifiedEvent) =>
    {
        this.log('onCloneInfoModified', event);
    };
}
