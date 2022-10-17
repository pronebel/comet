<script lang="ts">
  import { onMount } from "svelte";
  import type { EditableView } from "../ui/editableView";

  export let view: EditableView;

  let container: HTMLDivElement;

  onMount(() => {
    view.setContainer(container);
  });
</script>

<div
  data-section="editorView"
  class="fill flex-container-center"
  bind:this={container} />
