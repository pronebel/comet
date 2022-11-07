import { getGlobalEmitter } from '../../core/events';
import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import { getInstance, hasInstance } from '../../core/nodes/instances';
import { AssignCustomPropCommand } from '../commands/assignCustomProp';
import { CreateNodeCommand } from '../commands/createNode';
import { RemoveCustomPropCommand } from '../commands/removeCustomProp';
import { RemoveNodeCommand } from '../commands/removeNode';
import { SetCustomPropCommand } from '../commands/setCustomProp';
import { UnAssignCustomPropCommand } from '../commands/unassignCustomProp';
import type { DatastoreBase } from './datastoreBase';
import type { DatastoreNodeEvent } from './events';
import { getUserLogColor, getUserName } from './user';

const globalEmitter = getGlobalEmitter<DatastoreNodeEvent>();

const userName = getUserName();
const userColor = getUserLogColor(userName);
const logId = `${userName}`;
const logStyle = 'color:cyan';

export class NodeUpdater
{
    constructor(public readonly datastore: DatastoreBase<any, any>)
    {
        globalEmitter
            .on('datastore.node.created', this.onNodeCreated)
            .on('datastore.node.hydrated', this.onNodeCreated)
            .on('datastore.node.removed', this.onNodeRemoved)
            .on('datastore.node.parent.set', this.onParentSet)
            .on('datastore.node.customProp.defined', this.onCustomPropDefined)
            .on('datastore.node.customProp.undefined', this.onCustomPropUndefined)
            .on('datastore.node.customProp.assigned', this.onCustomPropAssigned)
            .on('datastore.node.customProp.unassigned', this.onCustomPropUnassigned)
            .on('datastore.node.model.modified', this.onModelModified)
            .on('datastore.node.cloneInfo.modified', this.onCloneInfoModified);
    }

    protected log(eventName: string, event: any)
    {
        console.log(`%c${logId}:%c${eventName} ${JSON.stringify(event)}`, userColor, logStyle);
    }

    protected onNodeCreated = (event: DatastoreNodeEvent['datastore.node.created']) =>
    {
        const { nodeId } = event;

        this.log('onNodeCreated', event);

        if (hasInstance(nodeId) && getInstance<ClonableNode>(nodeId).isCloaked)
        {
            getInstance<ClonableNode>(nodeId).uncloak();
        }
        else
        {
            const nodeSchema = this.datastore.getNodeAsJSON(event.nodeId);

            new CreateNodeCommand({ nodeSchema }).run();
        }
    };

    protected onNodeRemoved = (event: DatastoreNodeEvent['datastore.node.removed']) =>
    {
        this.log('onNodeRemoved', event);

        const nodeId = event.nodeId;

        new RemoveNodeCommand({ nodeId }).run();
    };

    protected onParentSet = (event: DatastoreNodeEvent['datastore.node.parent.set']) =>
    {
        this.log('onParentSet', event);

        const { nodeId, parentId } = event;

        // update graph node
        const parentNode = getInstance<ClonableNode>(parentId);
        const childNode = getInstance<ClonableNode>(nodeId);

        if (parentNode.children.indexOf(childNode) === -1)
        {
            parentNode.addChild(childNode);
        }
    };

    protected onCustomPropDefined = (event: DatastoreNodeEvent['datastore.node.customProp.defined']) =>
    {
        this.log('onCustomPropDefined', event);

        const { nodeId, customKey, type, value } = event;

        new SetCustomPropCommand({ nodeId, customKey, type, value, updateMode: 'graphOnly' }).run();
    };

    protected onCustomPropUndefined = (event: DatastoreNodeEvent['datastore.node.customProp.undefined']) =>
    {
        this.log('onCustomPropUndefined', event);

        const { nodeId, customKey } = event;

        new RemoveCustomPropCommand({ nodeId, customKey, updateMode: 'graphOnly' }).run();
    };

    protected onCustomPropAssigned = (event: DatastoreNodeEvent['datastore.node.customProp.assigned']) =>
    {
        this.log('onCustomPropAssigned', event);

        const { nodeId, modelKey, customKey } = event;

        new AssignCustomPropCommand({ nodeId, modelKey, customKey, updateMode: 'graphOnly' }).run();
    };

    protected onCustomPropUnassigned = (event: DatastoreNodeEvent['datastore.node.customProp.unassigned']) =>
    {
        this.log('onCustomPropUnassigned', event);

        const { nodeId, modelKey } = event;

        new UnAssignCustomPropCommand({ nodeId, modelKey, updateMode: 'graphOnly' }).run();
    };

    protected onModelModified = (event: DatastoreNodeEvent['datastore.node.model.modified']) =>
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

    protected onCloneInfoModified = (event: DatastoreNodeEvent['datastore.node.cloneInfo.modified']) =>
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
}
