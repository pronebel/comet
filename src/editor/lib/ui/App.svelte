<script lang="ts">
  import { onMount } from "svelte";
  import { createApp } from "../test/testCoreDataModelApp";
  import HotReload from "./HotReload.svelte";
  import TestCoreDataModel from "../test/TestCoreDataModel.svelte";

  let canvas: HTMLCanvasElement;

  onMount(() => {
    createApp(canvas);
  });
</script>

<main>
  <canvas bind:this={canvas} />
  {#if canvas}
    <TestCoreDataModel />
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
