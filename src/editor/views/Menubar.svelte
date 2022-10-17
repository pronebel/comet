<script lang="ts">
  import { Application } from "../application";
</script>

<div data-section="menubar" class="fill flex-center">
  <button on:click={() => Application.instance.createProject("Test", "test")}
    >Create</button
  >
  <button>Open</button>
</div>

<style>
  [data-section="menubar"] {
    background-color: var(--menubar-bg-color);
  }

  button {
    margin: 0 5px;
  }
</style>
