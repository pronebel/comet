<script lang="ts">
  import { Application } from "../application";
  import EditorView from "./EditorView.svelte";
  import DropZone from "./DropZone.svelte";
</script>

<div data-section="viewport" class="fill">
  <DropZone>
    <EditorView view={Application.instance.editorView} />
  </DropZone>
</div>

<style>
  [data-section="viewport"] {
    background-color: var(--container-bg-color);
  }
</style>
