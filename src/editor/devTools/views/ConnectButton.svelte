<script lang="ts">
  import { getUrlParam } from "../../util";
  import { DevToolsApp } from "./../app";

  let isInitialising = false;

  const app = DevToolsApp.getInstance();

  const onConnect = () => {
    if (isInitialising) {
      return;
    }
    isInitialising = true;
    app.init().then(() => {
      onInit && onInit();
    });
  };

  if (getUrlParam<number>("connect") === 1) {
    onConnect();
  }

  export let onInit: () => void;
</script>

<div>
  <button on:click={onConnect}
    >{isInitialising ? "Connecting..." : "Connect"}</button
  >
</div>

<style>
  div {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 95px;
    display: flex;
    flex-direction: column;
    font-size: 8pt;
  }

  button {
    width: 100%;
    margin-bottom: 2px;
    z-index: 100;
    opacity: 0.7;
    font-size: inherit;
    cursor: pointer;
    height: 19px;
    padding: 1px;
  }
</style>
