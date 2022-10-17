<script lang="ts">
  import { onMount } from "svelte";
  import { Application } from "../application";
  import HotReload from "./HotReload.svelte";
  import MainLayout from "./MainLayout.svelte";

  const app: Application = new Application({});

  let isConnected = false;
  let connectionError: Error | undefined;

  onMount(() => {
    app
      .connect()
      .then(() => {
        isConnected = true;
      })
      .catch((e) => {
        connectionError = e;
      });
  });
</script>

<main>
  {#if connectionError}
    <div class="error">{connectionError}</div>
  {:else if isConnected}
    <MainLayout />
  {/if}

  <HotReload />
</main>

<style>
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
    position: absolute;
  }

  .error {
    top: 0;
    left: 0;
    right: 0;
    height: 20px;
  }
</style>
