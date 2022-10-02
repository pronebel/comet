import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import { getInstance } from '../../core/nodes/instances';
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
    DSPrevIDSetEvent,
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
            .on('cloneInfoModified', this.onCloneInfoModified)
            .on('prevIdSet', this.onPrevIdSet);
    }

    protected log(eventName: string, event: any)
    {
        console.log(`%c${userName}:${eventName} ${JSON.stringify(event)}`, 'color:yellow');
    }

    protected onNodeCreated = (event: DSNodeCreatedEvent) =>
    {
        this.log('onNodeCreated', event);

        const nodeSchema = this.datastore.getNodeElementSchema(event.nodeId);

        new CreateNodeCommand({ nodeSchema, isNewNode: false }).run();
    };

    protected onNodeRemoved = (event: DSNodeRemovedEvent) =>
    {
        this.log('onNodeRemoved', event);

        const nodeId = event.nodeId;

        new RemoveNodeCommand({ nodeId, updateMode: 'graphOnly' }).run();
    };

    protected onParentSet = (event: DSParentSetEvent) =>
    {
        this.log('onParentSet', event);

        const { nodeId, parentId } = event;

        // update graph node
        const parentNode = getInstance<ClonableNode>(parentId);
        const childNode = getInstance<ClonableNode>(nodeId);

        parentNode.addChild(childNode);
    };

    protected onCustomPropDefined = (event: DSCustomPropDefinedEvent) =>
    {
        this.log('onCustomPropDefined', event);

        const { nodeId, customKey, type, value } = event;

        new SetCustomPropCommand({ nodeId, customKey, type, value, updateMode: 'graphOnly' }).run();
    };

    protected onCustomPropUndefined = (event: DSCustomPropUndefinedEvent) =>
    {
        this.log('onCustomPropUndefined', event);

        const { nodeId, customKey } = event;

        new RemoveCustomPropCommand({ nodeId, customKey, updateMode: 'graphOnly' }).run();
    };

    protected onCustomPropAssigned = (event: DSCustomPropAssignedEvent) =>
    {
        this.log('onCustomPropAssigned', event);

        const { nodeId, modelKey, customKey } = event;

        new AssignCustomPropCommand({ nodeId, modelKey, customKey, updateMode: 'graphOnly' }).run();
    };

    protected onCustomPropUnassigned = (event: DSCustomPropUnassignedEvent) =>
    {
        this.log('onCustomPropUnassigned', event);

        const { nodeId, modelKey } = event;

        new UnAssignCustomPropCommand({ nodeId, modelKey, updateMode: 'graphOnly' }).run();
    };

    protected onModelModified = (event: DSModelModifiedEvent) =>
    {
        this.log('onModelModified', event);

        const { key, nodeId, value } = event;

        const node = getInstance<ClonableNode>(nodeId);

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

        const node = getInstance<ClonableNode>(nodeId);
        const cloneInfo = node.cloneInfo;

        // remove from existing cloners .cloned info
        if (cloneInfo.cloner)
        {
            cloneInfo.cloner.cloneInfo.removeCloned(node);
        }

        // set new cloner
        if (cloner)
        {
            const clonerNode = getInstance<ClonableNode>(cloner);

            clonerNode.cloneInfo.cloned.push(node);
            cloneInfo.cloner = clonerNode;
        }
        else
        {
            delete cloneInfo.cloner;
        }

        // overwrite cloneMode and cloners
        cloneInfo.cloneMode = cloneMode;
        cloneInfo.cloned = cloned.map((clonedId) => getInstance<ClonableNode>(clonedId));
    };

    protected onPrevIdSet = (event: DSPrevIDSetEvent) =>
    {
        this.log('onPrevIdSet', event);

        const { nodeId, prevId } = event;
        const node = getInstance<ClonableNode>(nodeId);

        node.prevId = prevId;
    };
}
