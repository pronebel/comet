<script lang="ts">
  import { onMount } from "svelte";
  import { createApp } from "./app";
  import HotReload from "./HotReload.svelte";
  import Testing from "./Testing.svelte";

  let canvas: HTMLCanvasElement;

  onMount(() => {
    createApp(canvas);
  });
</script>

<main>
  <canvas bind:this={canvas} />
  {#if canvas}
    <Testing />
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
