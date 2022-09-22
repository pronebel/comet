<script lang="ts">
  import { CloneMode } from "../../../core/lib/nodes/cloneInfo";
  import type { ContainerNode } from "../../../core/lib/nodes/concrete/container";
  import { getGraphNode } from "../../../core/lib/nodes/factory";
  import { getUserName } from "../sync/user";

  import { TestApp } from "./testApp";

  const userName = getUserName();

  let customPropName: string = "prop1";
  let customPropValue: string = "foo1";
  let assignModelKey: string = "label";
  let undoStackEnd: number = 0;

  let isInit = false;
  let isInitialising = false;
  let shouldUpdateDebug = true;

  const app = TestApp.getInstance();

  const onInit = () => {
    isInitialising = true;
    app.init().then(() => {
      isInit = true;
    });
  };

  const onReload = () => {
    window.location.reload();
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

  const onInspectDatastore = () => {
    app.inspectDatastore();
  };

  const onSaveDatastore = () => {
    app.saveDatastore();
  };

  const onRestoreDatastore = () => {
    app.restoreDatastore();
  };

  const onClearDatastore = () => {
    app.clearDatastore();
    console.log("Datastore cleared");
  };

  const onWriteUndoStack = () => {
    app.writeUndoStack(undoStackEnd);
  };

  const onReadUndoStack = () => {
    app.readUndoStack();
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
        const node = getGraphNode(match[1]);
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
  {#if isInit}
    <button on:click={onNewContainer}>New Empty</button>
    <button on:click={onNewChild}>New Child</button>
    <button on:click={onCloneVariant}>+ Variant</button>
    <button on:click={onCloneReference}>+ Reference</button>
    <button on:click={onDuplicate}>+ Duplicate</button>
    <button on:click={onUnlink}>Unlink</button>
    <button on:click={onDelete}>Delete</button>
    <button on:click={onInspect}>Inspect</button>
    <hr />
    <button on:click={onReload}>Reload</button>
    <button on:click={onRestoreDatastore}>Restore DStore</button>
    <button on:click={onSaveDatastore}>Save DStore</button>
    <button on:click={onInspectDatastore}>Inspect DStore</button>
    <button on:click={onClearDatastore}>Clear DStore</button>
    <hr />
    <input bind:value={undoStackEnd} />
    <button on:click={onWriteUndoStack}>Save Cmds</button>
    <button on:click={onReadUndoStack}>Load Cmds</button>
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
    <button on:click={onInit}
      >{isInitialising ? "Connecting..." : "Connect"}</button
    >
  {/if}
  <marker />
  <user>{userName}</user>
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
</style>
