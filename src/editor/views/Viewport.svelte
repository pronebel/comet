<script lang="ts">
  import { Application } from "../application";
  import EditorView from "./EditorView.svelte";
</script>

<div data-section="viewport" class="fill">
  <EditorView view={Application.instance.editorView} />
</div>

<style>
  [data-section="viewport"] {
    background-color: var(--container-bg-color);
  }
</style>
