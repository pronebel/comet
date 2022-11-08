<script lang="ts">
  import Menubar from "./Menubar.svelte";
  import Viewport from "./Viewport.svelte";
  import { Application } from "../application";

  Application.instance.init();
</script>

<div data-section="main-layout">
  <div data-section="header">
    <Menubar />
  </div>
  <div data-section="body">
    <Viewport />
  </div>
</div>

<style>
  [data-section="main-layout"] {
    position: absolute;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    background-color: var(--main-bg-color);
  }

  [data-section="header"] {
    flex-grow: 0;
    height: 30px;
  }

  [data-section="body"] {
    flex-grow: 1;
  }
</style>
