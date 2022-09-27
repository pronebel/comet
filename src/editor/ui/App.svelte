<script lang="ts">
  import TestAppView from "../test/TestApp.svelte";

  import { onMount } from "svelte";
  import HotReload from "./util/HotReload.svelte";
  import { TestApp } from "../test/testApp";
  import { Editor } from "../editor";
  import type { Application } from "../application";

  const isTestApp = true;

  let windowError: Error | undefined;
  let isConnected = false;
  let connectionError: Error | undefined;

  let canvas: HTMLCanvasElement;

  onMount(() => {
    let app: Application;

    if (isTestApp) {
      app = new TestApp({ canvas });
    } else {
      app = new Editor({ canvas });
    }

    app
      .connect()
      .then(() => {
        isConnected = true;
      })
      .catch((e) => {
        connectionError = e;
      });
  });

  window.addEventListener("error", (error: ErrorEvent) => {
    windowError = error.error;
  });
</script>

<main>
  <canvas bind:this={canvas} />
  {#if connectionError}
    <div class="error">{connectionError}</div>
  {:else if isConnected && canvas}
    {#if isTestApp}
      <TestAppView />
    {:else}
      <!-- todo: EditorApp-->
    {/if}
  {/if}
  {#if windowError}
    <div class="windowError">
      <!-- svelte-ignore a11y-invalid-attribute -->
      <a href="javascript:window.location.reload()">Reload</a>
      <pre>{windowError.stack?.replace(/ at /g, "\nat ")}</pre>
    </div>
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
  .error,
  .windowError {
    font-weight: bold;
    text-align: center;
    background-color: red;
    color: white;
    position: absolute;
  }

  .error {
    top: 0;
    left: 0;
    right: 0;
    height: 20px;
  }

  .windowError {
    top: 20px;
    left: 20px;
    right: 20px;
    line-height: 12px;
    text-align: center;
    z-index: 100;
    border: 2px dashed white;
    padding: 5px;
    white-space: pre-line;
    font-size: 12px;
  }

  .windowError a {
    position: absolute;
    top: 0;
    right: 0;
    background-color: blue;
    color: white;
    padding: 3px;
    border-radius: 5px;
  }
</style>
