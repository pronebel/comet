<script lang="ts">
  import { getGlobalEmitter } from "../../core/events";
  import { Actions } from "../actions";
  import type { ProjectEvent } from "../events/projectEvents";
  let isReady = false;
  const globalEmitter = getGlobalEmitter<ProjectEvent>();
  globalEmitter.on("project.ready", () => (isReady = true));
</script>

<div data-section="menubar" class="fill flex-container-center">
  {#if isReady}
    <button on:click={() => Actions.newContainer.dispatch()}
      >New Container</button>
    <button
      on:click={() =>
        Actions.newSprite.dispatch({
          addToSelected: true,
        })}>New Node</button>
  {/if}
</div>

<style>
  [data-section="menubar"] {
    background-color: var(--menubar-bg-color);
  }

  button {
    margin: 0 5px;
  }
</style>
