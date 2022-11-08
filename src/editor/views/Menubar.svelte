<script lang="ts">
  import { Actions } from "../actions";
</script>

<div data-section="menubar" class="fill flex-container-center">
  <button on:click={() => Actions.newContainer.exec()}>New Container</button>
  <button on:click={() => Actions.newSprite.exec()}>New Node</button>
</div>

<style>
  [data-section="menubar"] {
    background-color: var(--menubar-bg-color);
  }

  button {
    margin: 0 5px;
  }
</style>
