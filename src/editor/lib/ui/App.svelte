<script lang="ts">
  import TestCoreDataModel from "../test/TestApp.svelte";

  import { onMount } from "svelte";
  import HotReload from "./util/HotReload.svelte";
  import { TestApp } from "../test/testApp";
  import { Editor } from "../editor";

  const isTestingDataModel = true;

  let canvas: HTMLCanvasElement;

  onMount(() => {
    if (isTestingDataModel) {
      new TestApp({ canvas });
    } else {
      new Editor({ canvas });
    }
  });
</script>

<main>
  <canvas bind:this={canvas} />
  {#if canvas}
    {#if isTestingDataModel}
      <TestCoreDataModel />
    {:else}
      <!-- todo: EditorApp-->
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
