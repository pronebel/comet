<script lang="ts">
  import { CloneMode } from "../../../core/lib/clone";

  import { app } from "./testCoreDataModelApp";

  let customPropName: string = "prop1";
  let customPropValue: string = "foo1";
  let assignModelKey: string = "label";

  let shouldUpdateDebug = true;

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
    console.clear();
    app.inspect();
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
    on:mouseover={() => (shouldUpdateDebug = false)}
    on:mouseout={() => (shouldUpdateDebug = true)}>
  <span /></pre>
  <button on:click={onNewContainer}>New Container</button>
  <button on:click={onNewChild}>New Child</button>
  <button on:click={onCloneVariant}>Clone Variant</button>
  <button on:click={onCloneReference}>Clone Reference</button>
  <button on:click={onDuplicate}>Duplicate</button>
  <button on:click={onUnlink}>Unlink</button>
  <button on:click={onDelete}>Delete</button>
  <button on:click={onInspect}>Inspect</button>
  <br />
  <button on:click={onDeselect}>Deselect</button>
  <button on:click={onRandColor}>Rand Color</button>
  <button on:click={onRandSize}>Rand Size</button>
  <button on:click={onRotate}>Rotate</button>
  <button on:click={onResetModel}>Reset Model</button>
  <br />
  <button on:click={onSetCustomProp}>Set Custom Prop</button>
  <keyvalue>
    <input bind:value={customPropName} />
    <input bind:value={customPropValue} />
  </keyvalue>
  <button on:click={onRemoveCustomProp}>Remove Custom Prop</button>
  <br />
  <button on:click={onAssignCustomProp}>Assign Custom Prop</button>
  <button on:click={onUnAssignCustomProp}>UnAssign Custom Prop</button>
  <input bind:value={assignModelKey} />
  <marker />
</buttons>

<style>
  buttons {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 250px;
    display: flex;
    flex-direction: column;
  }

  button {
    width: 100%;
    margin-bottom: 10px;
    font-size: 10pt;
    z-index: 100;
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

  keyvalue {
    display: flex;
    width: 100%;
  }

  keyvalue input {
    width: 50%;
  }

  input {
    flex-grow: 0;
    margin-bottom: 10px;
    font-size: 12px;
    text-align: center;
    border-color: #666;
    padding: 5px;
    z-index: 100;
  }

  br {
    width: 100%;
  }

  pre {
    position: fixed;
    bottom: 0;
    right: 0;
    left: 0;
    height: 50%;
    background-color: #000;
    overflow-y: auto;
    font-size: 14px;
    font-family: "Courier New", Courier, monospace;
    padding: 5px;
    line-height: 16px;
  }
</style>
