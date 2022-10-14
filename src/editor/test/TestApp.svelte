<script lang="ts">
  import Replay from "./Replay.svelte";
  import Inspector from "./Inspector.svelte";
  import Actions from "./Actions.svelte";
  import ConnectButton from "./ConnectButton.svelte";

  let isInit = false;
</script>

<div id="testApp">
  <Inspector />
  {#if isInit}
    <Replay />
    <Actions />
  {:else}
    <ConnectButton onInit={() => (isInit = true)} />
  {/if}
</div>

<style>
  div {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }
</style>
