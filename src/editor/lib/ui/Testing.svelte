<script lang="ts">
  import { SpawnMode } from "../../../core/lib/component";

  import { app } from "../app";

  const onNewClick = () => {
    app.newComponent();
  };

  const onDeselectClick = () => {
    app.deselect();
  };

  const onCopyVariantClick = () => {
    app.copy(SpawnMode.Variant);
  };

  const onCopyReferenceClick = () => {
    app.copy(SpawnMode.Reference);
  };

  const onCopyDuplicateClick = () => {
    app.copy(SpawnMode.Duplicate);
  };

  const onUnlink = () => {
    app.unlink();
  };

  const onDelete = () => {
    app.deleteSelected();
  };

  const onRandColorClicked = () => {
    app.randColor();
  };

  const onRandSizeClicked = () => {
    app.randSize();
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
  <button on:click={onNewClick}>New</button>
  <button on:click={onDeselectClick}>Deselect</button>
  <button on:click={onCopyVariantClick}>Copy as Variant</button>
  <button on:click={onCopyReferenceClick}>Copy as Rererence</button>
  <button on:click={onCopyDuplicateClick}>Copy as Duplicate</button>
  <button on:click={onUnlink}>Unlink</button>
  <button on:click={onDelete}>Delete</button>
  <button on:click={onRandColorClicked}>Rand Color</button>
  <button on:click={onRandSizeClicked}>Rand Size</button>
  <button on:click={onResetModel}>Reset Model</button>
  <button on:click={onInspect}>Inspect</button>
  <test />
</buttons>

<style>
  buttons {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 150px;
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
    top: 20px;
    left: 20px;
    width: 20px;
    height: 20px;
    border: 1px dashed yellow;
    pointer-events: none;
    box-sizing: border-box;
  }
</style>
