import { getGraphNode } from '../../core/nodes/nodeFactory';
import { AssignCustomPropCommand } from '../commands/assignCustomProp';
import { CreateNodeCommand } from '../commands/createNode';
import { RemoveCustomPropCommand } from '../commands/removeCustomProp';
import { RemoveNodeCommand } from '../commands/removeNode';
import { SetCustomPropCommand } from '../commands/setCustomProp';
import { UnAssignCustomPropCommand } from '../commands/unassignCustomProp';
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

        const { nodeId, customKey, type, value } = event;

        new SetCustomPropCommand({ nodeId, customKey, type, value, isRemoteUpdate: true }).exec();
    };

    protected onCustomPropUndefined = (event: DSCustomPropUndefinedEvent) =>
    {
        this.log('onCustomPropUndefined', event);

        const { nodeId, customKey } = event;

        new RemoveCustomPropCommand({ nodeId, customKey, isRemoteUpdate: true }).exec();
    };

    protected onCustomPropAssigned = (event: DSCustomPropAssignedEvent) =>
    {
        this.log('onCustomPropAssigned', event);

        const { nodeId, modelKey, customKey } = event;

        new AssignCustomPropCommand({ nodeId, modelKey, customKey, isRemoteUpdate: true }).exec();
    };

    protected onCustomPropUnassigned = (event: DSCustomPropUnassignedEvent) =>
    {
        this.log('onCustomPropUnassigned', event);

        const { nodeId, modelKey } = event;

        new UnAssignCustomPropCommand({ nodeId, modelKey, isRemoteUpdate: true }).exec();
    };

    protected onModelModified = (event: DSModelModifiedEvent) =>
    {
        this.log('onModelModified', event);

        const { key, nodeId, value } = event;

        const node = getGraphNode(nodeId);

        if (key === null)
        {
            // whole object was passed as value
            node.model.setValues(value as object);
        }
        else
        {
            // individual key
            node.model.setValue(key, value);
        }
    };

    protected onCloneInfoModified = (event: DSCloneInfoModifiedEvent) =>
    {
        this.log('onCloneInfoModified', event);

        const { nodeId, cloner, cloneMode, cloned } = event;

        const node = getGraphNode(nodeId);
        const cloneInfo = node.cloneInfo;

        // remove from existing cloners .cloned info
        if (cloneInfo.cloner)
        {
            cloneInfo.cloner.cloneInfo.removeCloned(node);
        }

        // set new cloner
        if (cloner)
        {
            const clonerNode = getGraphNode(cloner);

            clonerNode.cloneInfo.cloned.push(node);
            cloneInfo.cloner = clonerNode;
        }
        else
        {
            delete cloneInfo.cloner;
        }

        // overwrite cloneMode and cloners
        cloneInfo.cloneMode = cloneMode;
        cloneInfo.cloned = cloned.map((clonedId) => getGraphNode(clonedId));
    };
}
