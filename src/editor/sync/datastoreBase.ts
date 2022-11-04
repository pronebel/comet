import { EventEmitter } from 'eventemitter3';
import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import type { CustomPropertyType, CustomPropertyValueType } from '../../core/nodes/customProperties';
import type { NodeSchema, CloneInfoSchema } from '../../core/nodes/schema';
import type { DatastoreEvent } from './datastoreEvents';

export interface Datastore {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    batch(fn: () => void): Promise<void>;
    registerNode(nodeId: string): void;
    hasNode(nodeId: string): boolean;
    hasRegisteredNode(nodeId: string): boolean;
    getNodeAsJSON(nodeId: string): NodeSchema;
    createProject(name: string, id?: string): Promise<ClonableNode>;
    openProject(id: string): Promise<ClonableNode>;
    hasProject(name: string): Promise<boolean>;
    closeProject(name: string): Promise<void>;
    deleteProject(name: string): Promise<void>;
    hydrate(): ClonableNode;
    reset(): void;
}

export interface DatastoreCommandProvider
{
    // command API
    createNode(nodeSchema: NodeSchema): void;
    removeNode(nodeId: string): void;
    setNodeParent(childId: string, parentId: string): void;
    modifyNodeModel(nodeId: string, values: object): void;
    updateNodeCloneInfo(nodeId: string, cloneInfoSchema: CloneInfoSchema): void;
    setCustomProperty(nodeId: string, customKey: string, type: CustomPropertyType, value: CustomPropertyValueType | undefined): void;
    removeCustomProperty(nodeId: string, customKey: string): void;
    assignCustomProperty(nodeId: string, modelKey: string, customKey: string): void;
    unassignCustomProperty(nodeId: string, modelKey: string): void;
}

export interface DatastoreChangeEventHandler<ChangeEventType> {
    onNodeCreated(event: ChangeEventType): void;
    onNodeRemoved(event: ChangeEventType): void;
    onNodeRootPropertySet(event: ChangeEventType): void;
    onNodeDefinedCustomPropSet(event: ChangeEventType): void;
    onNodeDefinedCustomPropRemoved(event: ChangeEventType): void;
    onNodeAssignedCustomPropSet(event: ChangeEventType): void;
    onNodeAssignedCustomPropRemoved(event: ChangeEventType): void;
    onNodeModelPropertySet(event: ChangeEventType): void;
    onNodeModelValueSet(event: ChangeEventType): void;
    onNodeModelPropertyRemove(event: ChangeEventType): void;
    onNodeCloneInfoValueSet(event: ChangeEventType): void;
}

export abstract class DatastoreBase<NodeProxyObject, ChangeEventType> 
    extends EventEmitter<DatastoreEvent>
    implements Datastore, DatastoreCommandProvider, DatastoreChangeEventHandler<ChangeEventType>
{

    protected nodeProxies: Map<string, NodeProxyObject>;

    constructor() {
        super();

        this.nodeProxies = new Map();
    }

    // general public API
    public abstract connect(): Promise<void>;
    public abstract disconnect(): Promise<void>;
    public abstract batch(fn: () => void): Promise<void>;
    public abstract registerNode(nodeId: string): void;
    public abstract hasNode(nodeId: string): boolean;
    public abstract hasRegisteredNode(nodeId: string): boolean;
    public abstract getNodeAsJSON(nodeId: string): NodeSchema;
    public abstract createProject(name: string, id?: string): Promise<ClonableNode>;
    public abstract openProject(id: string): Promise<ClonableNode>;
    public abstract hasProject(name: string): Promise<boolean>;
    public abstract closeProject(name: string): Promise<void>;
    public abstract deleteProject(name: string): Promise<void>;
    public abstract hydrate(): ClonableNode;
    public abstract reset(): void;

    // command API
    public abstract createNode(nodeSchema: NodeSchema): void;
    public abstract removeNode(nodeId: string): void;
    public abstract setNodeParent(childId: string, parentId: string): void;
    public abstract modifyNodeModel(nodeId: string, values: object): void;
    public abstract updateNodeCloneInfo(nodeId: string, cloneInfoSchema: CloneInfoSchema): void;
    public abstract setCustomProperty(nodeId: string, customKey: string, type: CustomPropertyType, value: CustomPropertyValueType | undefined): void;
    public abstract removeCustomProperty(nodeId: string, customKey: string): void;
    public abstract assignCustomProperty(nodeId: string, modelKey: string, customKey: string): void;
    public abstract unassignCustomProperty(nodeId: string, modelKey: string): void;
    
    // change event handles
    public abstract onNodeCreated(event: ChangeEventType): void;
    public abstract onNodeRemoved(event: ChangeEventType): void;
    public abstract onNodeRootPropertySet(event: ChangeEventType): void;
    public abstract onNodeDefinedCustomPropSet(event: ChangeEventType): void;
    public abstract onNodeDefinedCustomPropRemoved(event: ChangeEventType): void;
    public abstract onNodeAssignedCustomPropSet(event: ChangeEventType): void;
    public abstract onNodeAssignedCustomPropRemoved(event: ChangeEventType): void;
    public abstract onNodeModelPropertySet(event: ChangeEventType): void;
    public abstract onNodeModelValueSet(event: ChangeEventType): void;
    public abstract onNodeModelPropertyRemove(event: ChangeEventType): void;
    public abstract onNodeCloneInfoValueSet(event: ChangeEventType): void;
}