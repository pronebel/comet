<script lang="ts">
  import type { ClonableNode } from "../../core/nodes/abstract/clonableNode";
  import { CloneMode } from "../../core/nodes/cloneInfo";
  import type { ContainerNode } from "../../core/nodes/concrete/container";
  import { getInstance } from "../../core/nodes/instances";
  import { Auditor } from "../auditor";
  import { getUserName } from "../sync/user";
  import { getUrlParam } from "../util";
  import Replay from "./Replay.svelte";

  import { TestApp } from "./testApp";

  const userName = getUserName();

  let customPropName: string = "name";
  let customPropValue: string = "foo1";
  let assignModelKey: string = "label";
  let undoStackEnd: number = 0;
  let showReplay = true;

  let isInit = false;
  let isInitialising = false;
  let shouldUpdateDebug = true;

  const app = TestApp.getInstance();

  const onConnect = () => {
    if (isInitialising) {
      return;
    }
    isInitialising = true;
    app.init().then(() => {
      isInit = true;
    });
  };

  if (getUrlParam<number>("connect") === 1) {
    onConnect();
  }

  const onReload = () => {
    window.location.reload();
  };

  const onReOpen = () => {
    console.clear();
    const selectedId = app.selected?.id;
    app.openProject("test").then(() => {
      if (selectedId) {
        const node = getInstance<ClonableNode>(selectedId);
        app.select(node.cast());
      }
    });
  };

  const onNew = () => {
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
    app.writeCommandList("undo");
    app.undo();
  };

  const onRedo = () => {
    app.writeCommandList("redo");
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

  const onReplay = () => {
    localStorage["replayIndex"] = "1";
    onReadUndoStack();
    showReplay = true;
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

  const onPreMouseUp = () => {
    const selection = window.getSelection();
    const anchorNode = selection?.anchorNode;
    if (anchorNode) {
      const match = String(anchorNode.nodeValue).match(/<(.*)>/);
      if (match) {
        const node = getInstance<ClonableNode>(match[1]);
        node && app.select(node as unknown as ContainerNode);
        const debug = document.getElementById("debug") as HTMLPreElement;
        app.debug(debug);
      }
    }
  };

  setInterval(() => {
    const debug = document.getElementById("debug") as HTMLPreElement;
    if (debug && shouldUpdateDebug) {
      app && app.debug(debug);
    }
    if (localStorage.getItem("replayIndex") !== null && !showReplay) {
      onReplay();
    }
  }, 500);
</script>

<buttons>
  <!-- svelte-ignore a11y-mouse-events-have-key-events -->
  <pre
    id="debug"
    on:mouseup={onPreMouseUp}
    on:mouseover={() => (shouldUpdateDebug = false)}
    on:mouseout={() => (shouldUpdateDebug = true)}>
  <span /></pre>
  {#if showReplay}
    <Replay />
  {/if}
  {#if isInit}
    <button on:click={onNewContainer}>New Empty</button>
    <button on:click={onNewChild}>New Child</button>
    <button on:click={onDelete}>Delete</button>
    <button on:click={onCloneVariant}>+ Variant</button>
    <button on:click={onCloneReference}>+ Reference</button>
    <button on:click={onDuplicate}>+ Duplicate</button>
    <button on:click={onUnlink}>Unlink</button>
    <button on:click={onInspect}>Inspect</button>
    <button on:click={onUndo}>Undo</button>
    <button on:click={onRedo}>Redo</button>
    <hr />
    <input bind:value={undoStackEnd} />
    <button on:click={onReadUndoStack}>Load Undo</button>
    <button on:click={onReplay}>Replay</button>
    <button on:click={onPeekUndoStack}>Peek Undo</button>
    <button on:click={onWriteUndoStack}>Save Undo</button>
    <button on:click={onClearUndoStack}>Clear Undo</button>
    <hr />
    <button on:click={onReload}>Refresh</button>
    <button on:click={onNew}>New</button>
    <button on:click={onReOpen}>ReOpen</button>
    <button on:click={onRestoreDatastore}>Restore DStore</button>
    <button on:click={onSaveDatastore}>Save DStore</button>
    <button on:click={onInspectDatastore}>Inspect DStore</button>
    <button on:click={onAudit}>Audit</button>
    <hr />
    <button on:click={onDeselect}>Deselect</button>
    <button on:click={onRandColor}>Rand Color</button>
    <button on:click={onRandSize}>Rand Size</button>
    <button on:click={onRotate}>Rotate</button>
    <button on:click={onResetModel}>Clear Model</button>
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
  {:else}
    <button on:click={onConnect}
      >{isInitialising ? "Connecting..." : "Connect"}</button
    >
  {/if}
  <marker />
  <user>{userName}</user>
  <div id="undo" />
</buttons>

<style>
  buttons {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 95px;
    display: flex;
    flex-direction: column;
    font-size: 8pt;
  }

  button {
    width: 100%;
    margin-bottom: 5px;
    z-index: 100;
    opacity: 0.7;
    font-size: inherit;
    cursor: pointer;
  }

  marker {
    display: none;
    position: fixed;
    top: 0px;
    left: 0px;
    width: 20px;
    height: 20px;
    border: 1px dashed yellow;
    pointer-events: none;
    box-sizing: border-box;
  }

  user {
    position: fixed;
    top: calc(50% - 30px);
    left: 5px;
    color: yellow;
    font-size: 14px;
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
    margin-top: 5px;
    margin-bottom: 10px;
    border: none;
    border-bottom: 4px outset #8e8e8e;
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

  pre {
    position: fixed;
    bottom: 0;
    right: 0;
    left: 0;
    height: 50%;
    background-color: #000;
    background: linear-gradient(90deg, #111 0, #000 100%);
    overflow-y: auto;
    font-size: 10px;
    font-family: "Courier New", Courier, monospace;
    padding: 5px;
    line-height: 16px;
    margin: 0;
  }

  #undo {
    position: fixed;
    bottom: 8px;
    left: 10px;
    width: calc(100% - 95px);
    line-height: 14px;
    color: lightskyblue;
    background-color: rgba(0, 0, 0, 0.7);
    padding: 2px;
  }

  #replay {
    position: absolute;
    width: 100px;
    background-color: white;
  }
</style>
