<script lang="ts">
  import { newDebugNode } from "../actions/newDebugNode";
  import { newEmptyNode } from "../actions/newEmptyNode";
</script>

<div data-section="menubar" class="fill flex-container-center">
  <button on:click={() => newEmptyNode()}>New Container</button>
  <button on:click={() => newDebugNode()}>New Node</button>
</div>

<style>
  [data-section="menubar"] {
    background-color: var(--menubar-bg-color);
  }

  button {
    margin: 0 5px;
  }
</style>
