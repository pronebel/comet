<script lang="ts">
  import { SpawnMode } from "../../../core/lib/spawn";

  import { app } from "../app";

  let customPropValue: string = "foo";

  const onNewContainer = () => {
    app.newContainer();
  };

  const onNewChild = () => {
    app.newChild();
  };

  const onDeselect = () => {
    app.deselect();
  };

  const onCopyVariant = () => {
    app.copy(SpawnMode.Variant);
  };

  const onCopyReference = () => {
    app.copy(SpawnMode.Reference);
  };

  const onCopyDuplicate = () => {
    app.copy(SpawnMode.Duplicate);
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

  const onRandAlpha = () => {
    app.randAlpha();
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
    app.setCustomProp(customPropValue);
  };

  const onAssignCustomProp = () => {
    app.assignCustomProp();
  };

  const onUnAssignCustomProp = () => {
    app.unAssignCustomProp();
  };

  const onGetAssignedCustomProp = () => {
    app.getAssignedCustomProp();
  };

  const onRemoveCustomProp = () => {
    app.removeCustomProp();
  };

  setInterval(() => {
    const debug = document.getElementById("debug") as HTMLPreElement;
    if (debug) {
      app.debug(debug);
    }
  }, 500);
</script>

<buttons>
  <button on:click={onDeselect}>Deselect</button>
  <button on:click={onNewContainer}>New Container</button>
  <button on:click={onNewChild}>New Child</button>
  <button on:click={onCopyVariant}>Copy Variant</button>
  <button on:click={onCopyReference}>Copy Reference</button>
  <button on:click={onCopyDuplicate}>Duplicate</button>
  <button on:click={onDelete}>Delete</button>
  <button on:click={onUnlink}>Unlink</button>
  <button on:click={onRandColor}>Rand Color</button>
  <button on:click={onRandSize}>Rand Size</button>
  <button on:click={onRandAlpha}>Rand Alpha</button>
  <button on:click={onRotate}>Rotate</button>
  <button on:click={onResetModel}>Reset Model</button>
  <button on:click={onInspect}>Inspect</button>
  <br />
  <button on:click={onSetCustomProp}>Set Custom Prop</button>
  <input bind:value={customPropValue} />
  <button on:click={onRemoveCustomProp}>Remove Custom Prop</button>
  <button on:click={onAssignCustomProp}>Assign Custom Prop</button>
  <button on:click={onUnAssignCustomProp}>UnAssign Custom Prop</button>
  <button on:click={onGetAssignedCustomProp}>Get Assigned Custom Prop</button>
  <test />
  <pre id="debug" />
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
  buttons button {
    width: 100%;
    margin-bottom: 10px;
    font-size: 12pt;
  }

  buttons test {
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

  buttons input {
    margin-bottom: 10px;
    font-size: 16px;
    text-align: center;
    border-color: #666;
    padding: 5px;
  }

  buttons br {
    width: 100%;
  }

  buttons pre {
    position: fixed;
    bottom: 0;
    right: 0;
    left: 0;
    height: 450px;
    background-color: #000;
    overflow-y: auto;
    font-family: "Courier New", Courier, monospace;
    padding: 5px;
  }
</style>
