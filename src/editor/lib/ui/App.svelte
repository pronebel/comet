<script lang="ts">
  import TestCoreDataModel from "../test/TestApp.svelte";

  import { onMount } from "svelte";
  import HotReload from "./util/HotReload.svelte";
  import { TestApp } from "../test/testApp";
  import { Editor } from "../editor";
  import type { Application } from "../application";

  const isTestingDataModel = true;

  let isConnected = false;
  let connectionError: Error | undefined;

  let canvas: HTMLCanvasElement;

  onMount(() => {
    let app: Application;

    if (isTestingDataModel) {
      app = new TestApp({ canvas });
    } else {
      app = new Editor({ canvas });
    }

    app
      .connect()
      .then(() => {
        isConnected = true;
        app.init();
      })
      .catch((e) => {
        connectionError = e;
      });
  });
</script>

<main>
  <canvas bind:this={canvas} />
  {#if connectionError}
    <div class="error">{connectionError}</div>
  {:else if isConnected && canvas}
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
  .error {
    font-weight: bold;
    text-align: center;
    background-color: red;
    color: white;
  }
</style>
