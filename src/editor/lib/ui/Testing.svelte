<script lang="ts">
  import { SpawnMode } from "../../../core/lib/component";

  import { app } from "../app";

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

  const onResetModel = () => {
    app.resetModel();
  };

  const onInspect = () => {
    console.clear();
    app.inspect();
  };
</script>

<buttons>
  <button on:click={onNewContainer}>New Container</button>
  <button on:click={onNewChild}>New Child</button>
  <button on:click={onDeselect}>Deselect</button>
  <button on:click={onCopyVariant}>Copy as Variant</button>
  <button on:click={onCopyReference}>Copy as Reference</button>
  <button on:click={onCopyDuplicate}>Copy as Duplicate</button>
  <button on:click={onUnlink}>Unlink</button>
  <button on:click={onDelete}>Delete</button>
  <button on:click={onRandColor}>Rand Color</button>
  <button on:click={onRandSize}>Rand Size</button>
  <button on:click={onRandAlpha}>Rand Alpha</button>
  <button on:click={onResetModel}>Reset Model</button>
  <button on:click={onInspect}>Inspect</button>
  <test />
</buttons>

<style>
  buttons {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 200px;
    display: flex;
    flex-direction: column;
  }
  buttons button {
    width: 100%;
    margin-bottom: 10px;
    font-size: 12pt;
  }

  buttons test {
    position: fixed;
    top: 0px;
    left: 0px;
    width: 20px;
    height: 20px;
    border: 1px dashed yellow;
    pointer-events: none;
    box-sizing: border-box;
  }
</style>
