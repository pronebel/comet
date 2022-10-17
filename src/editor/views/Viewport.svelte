<script lang="ts">
  import { Application } from "../application";
  import type { EditableView } from "../ui/editableView";
  import EditorView from "./EditorView.svelte";

  let view: EditableView;

  Application.instance.on("editorViewCreated", (editableView: EditableView) => {
    view = editableView;
  });
</script>

<div data-section="viewport" class="fill">
  {#if view}
    <EditorView {view} />
  {/if}
</div>

<style>
  [data-section="viewport"] {
    background-color: var(--container-bg-color);
  }
</style>
