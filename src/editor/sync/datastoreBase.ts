import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import type { CustomPropertyType, CustomPropertyValueType } from '../../core/nodes/customProperties';
import type { NodeSchema, CloneInfoSchema } from '../../core/nodes/schema';

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

export abstract class DatastoreBase<ChangeEventType> implements DatastoreCommandProvider {
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
    public abstract hasProject(name: string): boolean;
    public abstract closeProject(name: string): Promise<void>;
    public abstract deleteProject(name: string): Promise<void>;
    public abstract hydrate(): Promise<ClonableNode>;
    // command API
    public abstract createNode: (nodeSchema: NodeSchema) => void;
    public abstract removeNode: (nodeId: string) => void;
    public abstract setNodeParent: (childId: string, parentId: string) => void;
    public abstract modifyNodeModel: (nodeId: string, values: object) => void;
    public abstract updateNodeCloneInfo: (nodeId: string, cloneInfoSchema: CloneInfoSchema) => void;
    public abstract setCustomProperty: (nodeId: string, customKey: string, type: CustomPropertyType, value: CustomPropertyValueType | undefined) => void;
    public abstract removeCustomProperty(nodeId: string, customKey: string): void;
    public abstract assignCustomProperty(nodeId: string, modelKey: string, customKey: string): void;
    public abstract unassignCustomProperty(nodeId: string, modelKey: string): void;
    // change event handles
    protected abstract onNodeCreated(event: ChangeEventType): void;
    protected abstract onNodeRemoved(event: ChangeEventType): void;
    protected abstract onNodeRootPropertySet(event: ChangeEventType): void;
    protected abstract onNodeDefinedCustomPropSet(event: ChangeEventType): void;
    protected abstract onNodeDefinedCustomPropRemoved(event: ChangeEventType): void;
    protected abstract onNodeAssignedCustomPropSet(event: ChangeEventType): void;
    protected abstract onNodeAssignedCustomPropRemoved(event: ChangeEventType): void;
    protected abstract onNodeModelPropertySet(event: ChangeEventType): void;
    protected abstract onNodeModelValueSet(event: ChangeEventType): void;
    protected abstract onNodeModelPropertyRemove(event: ChangeEventType): void;
    protected abstract onNodeCloneInfoValueSet(event: ChangeEventType): void;
}