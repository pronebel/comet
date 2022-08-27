<script lang="ts">
  import { app } from "../app";
  import { DebugComponent } from "../../../core/lib/components/debug";

  const onNewClick = () => {
    const component = new DebugComponent({
      x: 20,
      y: 20,
      width: 20,
      height: 20,
    });
    app.addComponent(component);
    app.randColor();
  };

  const onDeselectClick = () => {
    app.deselect();
  };

  const onCopyLinkedClick = () => {
    app.copy(true);
  };

  const onCopyUnLinkedClick = () => {
    app.copy(false);
  };

  const onRandColorClicked = () => {
    app.randColor();
  };

  const onRandSizeClicked = () => {
    app.randSize();
  };
</script>

<buttons>
  <button on:click={onNewClick}>New</button>
  <button on:click={onDeselectClick}>Deselect</button>
  <button on:click={onCopyLinkedClick}>Copy Linked</button>
  <button on:click={onCopyUnLinkedClick}>Copy UnLinked</button>
  <button on:click={onRandColorClicked}>Rand Color</button>
  <button on:click={onRandSizeClicked}>Rand Size</button>
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
  }
</style>
