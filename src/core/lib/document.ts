import EventEmitter from 'eventemitter3';

import type { CloneMode } from './clone';
import type { Component } from './component';
import type { CustomProperty } from './customProperties';

export type DocumentEvents = 'constructed'
| 'cloned'
| 'modelModified'
| 'childAdded'
| 'childRemoved'
| 'unlink'
| 'delete'
| 'setCustomProp'
| 'removeCustomProp'
| 'assignCustomProp'
| 'unassignCustomProp';

export class Document extends EventEmitter<DocumentEvents>
{
    constructor()
    {
        super();
        this.on('constructed', this.onConstructed);
        this.on('cloned', this.onCloned);
        this.on('modelModified', this.onModified);
        this.on('childAdded', this.onChildAdded);
        this.on('childRemoved', this.onChildRemoved);
        this.on('unlink', this.onUnlink);
        this.on('delete', this.onDelete);
        this.on('setCustomProp', this.onSetCustomProp);
        this.on('removeCustomProp', this.onRemoveCustomProp);
        this.on('assignCustomProp', this.onAssignCustomProp);
        this.on('unassignCustomProp', this.onUnAssignCustomProp);
    }

    public onConstructed = (component: Component) =>
    {
        console.log('constructed', { id: component.id });
    };

    public onCloned = (cloner: Component, cloned: Component, cloneMode: CloneMode, depth: number) =>
    {
        console.log('cloned', { cloner: cloner.id, cloned: cloned.id, cloneMode, depth });
    };

    public onModified = (component: Component, key: string, value: any, oldValue: any) =>
    {
        console.log('modelModified', { id: component.id, key, value, oldValue });
    };

    public onChildAdded = (parent: Component, child: Component) =>
    {
        console.log('childAdded', { parent: parent.id, child: child.id });
    };

    public onChildRemoved = (parent: Component, child: Component) =>
    {
        console.log('childRemoved', { parent: parent.id, child: child.id });
    };

    public onUnlink = (component: Component, unlinkChildren: boolean) =>
    {
        console.log('unlink', { component: component.id, unlinkChildren });
    };

    public onDelete = (component: Component) =>
    {
        console.log('delete', { component: component.id });
    };

    public onSetCustomProp = (component: Component, property: CustomProperty) =>
    {
        console.log('setCustomProp', { id: component.id, key: property.name, value: property.value });
    };

    public onRemoveCustomProp = (component: Component, property: CustomProperty) =>
    {
        console.log('removeCustomProp', { id: component.id, key: property.name, value: property.value });
    };

    public onAssignCustomProp = (component: Component, modelKey: string, property: CustomProperty) =>
    {
        console.log('assignCustomProp', { id: component.id, modelKey, customKey: property.name, value: property.value });
    };

    public onUnAssignCustomProp = (component: Component, modelKey: string) =>
    {
        console.log('unassignCustomProp', { id: component.id, modelKey });
    };
}

export const doc = new Document();
