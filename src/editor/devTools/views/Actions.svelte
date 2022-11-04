<script lang="ts">
  import type { ClonableNode } from "../../../core/nodes/abstract/clonableNode";
  import { CloneMode } from "../../../core/nodes/cloneInfo";
  import { unregisterInstance } from "../../../core/nodes/instances";
  import { Auditor } from "../auditor";
  import { diagnostics } from "../../diagnostics";

  import { DevToolsApp } from "./../app";

  let customPropName: string = "name";
  let customPropValue: string = "foo1";
  let assignModelKey: string = "label";
  let undoStackEnd: number = 0;

  const app = DevToolsApp.getInstance();

  const onReload = () => {
    window.location.reload();
  };

  const onReOpen = () => {
    console.clear();
    app.openProject("test");
  };

  const onPurge = () => {
    app.project?.walk<ClonableNode>((node) => {
      if (node.isCloaked) {
        if (app.datastore.hasNode(node.id)) {
          throw new Error(
            `Node "${node.id}" is cloaked but still in datastore`
          );
        }
        unregisterInstance(node);
        node.deleteSelf();
      }
    });
  };

  const onNew = () => {
    console.clear();
    app.createProject("Test", "test");
  };

  const onNewContainer = () => {
    app.newContainer();
  };

  const onNewChild = () => {
    app.newChild();
  };

  const onDeselect = () => {
    app.deselect();
  };

  const onCloneVariant = () => {
    app.clone(CloneMode.Variant);
  };

  const onCloneReference = () => {
    app.clone(CloneMode.Reference);
  };

  const onDuplicate = () => {
    app.clone(CloneMode.Duplicate);
  };

  const onUnlink = () => {
    app.unlink();
  };

  const onDelete = () => {
    app.deleteSelected();
  };

  const onRandColor = () => {
    app.randColor();
  };

  const onRandSize = () => {
    app.randSize();
  };

  const onRotate = () => {
    app.rotate();
  };

  const onResetModel = () => {
    app.resetModel();
  };

  const onInspect = () => {
    app.inspect();
  };

  const onUndo = () => {
    app.undo();
  };

  const onRedo = () => {
    app.redo();
  };

  const onInspectDatastore = () => {
    app.inspectDatastore();
  };

  const onAudit = () => {
    const auditor = new Auditor();
    const audit = auditor.audit();
    console.clear();
    console.log("%c\nGraph Nodes:", "font-weight:bold;color:cyan");
    console.table(audit.nodes);
    console.log("%c\nDatastore:", "font-weight:bold;color:cyan");
    console.table(audit.datastore);
  };

  const onSaveDatastore = () => {
    app.saveDatastore();
  };

  const onRestoreDatastore = () => {
    app.restoreDatastore();
  };

  const onClearUndoStack = () => {
    const size = app.undoStack.length;
    app.undoStack.clear();
    console.log(`${size} commands cleared`);
  };

  const onPeekUndoStack = () => {
    const commands = app.undoStack.stack;
    console.clear();
    console.log(`head: ${app.undoStack.head}`, commands);
  };

  const onWriteUndoStack = () => {
    const temp = localStorage["saveUndo"];
    localStorage["saveUndo"] = "1";
    app.writeUndoStack();
    localStorage["saveUndo"] = temp;
  };

  const onReadUndoStack = () => {
    app.readUndoStack(undoStackEnd);
  };

  const onShowDiagnostics = () => {
    console.clear();
    console.dir(diagnostics);
  };

  const onSetCustomProp = () => {
    app.setCustomProp(customPropName, customPropValue);
    app.fitSelection();
  };

  const onAssignCustomProp = () => {
    app.assignCustomProp(assignModelKey, customPropName);
    app.fitSelection();
  };

  const onUnAssignCustomProp = () => {
    app.unAssignCustomProp(assignModelKey);
    app.fitSelection();
  };

  const onRemoveCustomProp = () => {
    app.removeCustomProp(customPropName);
    app.fitSelection();
  };
</script>

<div>
  <button on:click={onNewContainer}>New Empty</button>
  <button on:click={onNewChild}>New Child</button>
  <button on:click={onDelete}>Delete</button>
  <button on:click={onCloneVariant}>+ Variant</button>
  <button on:click={onCloneReference}>+ Reference</button>
  <button on:click={onDuplicate}>+ Duplicate</button>
  <button on:click={onUnlink}>Unlink</button>
  <button on:click={onDeselect}>Deselect</button>
  <button on:click={onRandColor}>Rand Color</button>
  <button on:click={onRandSize}>Rand Size</button>
  <button on:click={onRotate}>Rotate</button>
  <button on:click={onResetModel}>Clear Model</button>
  <button on:click={onInspect}>Inspect</button>
  <hr />
  <button on:click={onUndo}>Undo</button>
  <button on:click={onRedo}>Redo</button>
  <button on:click={onClearUndoStack}>Clear Undo</button>
  <button on:click={onPeekUndoStack}>Inspect Undo</button>
  <button on:click={onWriteUndoStack}>Save Undo</button>
  <button on:click={onReadUndoStack}>Load Undo</button>
  <input bind:value={undoStackEnd} />
  <button on:click={onShowDiagnostics}>Diagnostics</button>
  <hr />
  <button on:click={onAudit}>Audit</button>
  <button on:click={onRestoreDatastore}>Restore DStore</button>
  <button on:click={onSaveDatastore}>Save DStore</button>
  <button on:click={onInspectDatastore}>Inspect DStore</button>
  <hr />
  <button on:click={onNew}>New</button>
  <button on:click={onReload}>Refresh</button>
  <button on:click={onReOpen}>ReOpen</button>
  <button on:click={onPurge}>Purge</button>
  <hr />
  <button on:click={onSetCustomProp}>Set Prop</button>
  <keyvalue>
    <input bind:value={customPropName} />
    <input bind:value={customPropValue} />
  </keyvalue>
  <button on:click={onRemoveCustomProp}>Remove Prop</button>
  <button on:click={onAssignCustomProp}>Assign Prop</button>
  <button on:click={onUnAssignCustomProp}>UnAssign Prop</button>
  <input bind:value={assignModelKey} />
</div>

<style>
  div {
    position: fixed;
    top: 10px;
    right: 10px;
    width: 95px;
    display: flex;
    flex-direction: column;
    font-size: 8pt;
  }

  button {
    width: 100%;
    margin-bottom: 2px;
    z-index: 100;
    opacity: 0.7;
    font-size: inherit;
    cursor: pointer;
    height: 19px;
    padding: 1px;
  }

  keyvalue {
    display: flex;
    width: 100%;
  }

  keyvalue input {
    width: 50%;
  }

  hr {
    width: 100%;
    height: 0px;
    margin: 0;
    margin-top: 2px;
    margin-bottom: 4px;
    border: none;
    border-bottom: 2px outset #8e8e8e;
    position: relative;
  }

  input {
    flex-grow: 0;
    margin-bottom: 5px;
    text-align: center;
    border: 1px solid #666;
    padding: 3px;
    z-index: 100;
    opacity: 0.7;
    font-size: inherit;
    height: 10px;
  }
</style>
