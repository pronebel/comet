<script lang="ts">
  import { onMount } from "svelte";
  import type { EditorView } from "../ui/editorView";

  export let editorView: EditorView;

  let canvas: HTMLCanvasElement;

  onMount(() => {
    editorView.canvas = canvas;
  });
</script>

<main>
  <canvas bind:this={canvas} />
</main>

<style>
  canvas,
  div {
    position: absolute;
    width: 100%;
    height: 100%;
  }
</style>
