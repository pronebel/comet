<script lang="ts">
  import { createApp } from "../test/testCoreDataModelApp";
  import TestCoreDataModel from "../test/TestCoreDataModel.svelte";

  import { onMount } from "svelte";
  import HotReload from "./util/HotReload.svelte";
  import { Application } from "../application";

  const isTestingDataModel = true;

  let canvas: HTMLCanvasElement;

  onMount(() => {
    if (isTestingDataModel) {
      createApp(canvas);
    } else {
      new Application();
    }
  });
</script>

<main>
  <canvas bind:this={canvas} />
  {#if canvas}
    {#if isTestingDataModel}
      <TestCoreDataModel />
    {:else}
      <!-- todo: application-->
    {/if}
  {/if}
  <HotReload />
</main>

<style>
  canvas,
  main {
    position: absolute;
    width: 100%;
    height: 100%;
  }
</style>
