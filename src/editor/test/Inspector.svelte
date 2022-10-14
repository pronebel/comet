<script lang="ts">
  import type { ClonableNode } from "../../core/nodes/abstract/clonableNode";
  import type { ContainerNode } from "../../core/nodes/concrete/container";
  import { getInstance } from "../../core/nodes/instances";
  import { getUserName } from "../sync/user";
  import { TestApp } from "./testApp";

  const userName = getUserName();

  let shouldUpdateDebug = true;

  const app = TestApp.getInstance();

  const onPreMouseUp = () => {
    const selection = window.getSelection();
    const anchorNode = selection?.anchorNode;
    if (anchorNode) {
      const match = String(anchorNode.nodeValue).match(/<(.*)>/);
      if (match) {
        const node = getInstance<ClonableNode>(match[1]);
        node && app.select(node as unknown as ContainerNode);
        const debug = document.getElementById("debug") as HTMLPreElement;
        app.debug(debug);
      }
    }
  };

  setInterval(() => {
    const debug = document.getElementById("debug") as HTMLPreElement;
    if (debug && shouldUpdateDebug) {
      app && app.debug(debug);
    }
  }, 500);
</script>

<div id="inspector">
  <!-- svelte-ignore a11y-mouse-events-have-key-events -->
  <pre
    id="debug"
    on:mouseup={onPreMouseUp}
    on:mouseover={() => (shouldUpdateDebug = false)}
    on:mouseout={() => (shouldUpdateDebug = true)}>
  <span /></pre>
  <user>{userName}</user>
  <undo id="undo" />
</div>

<style>
  div {
    position: fixed;
    bottom: 0;
    right: 0;
    left: 0;
    height: 50%;
  }

  user {
    position: fixed;
    top: calc(50% - 25px);
    left: 5px;
    color: yellow;
    font-size: 14px;
  }

  pre {
    position: absolute;
    width: 100%;
    height: 100%;
    background-color: #000;
    background: linear-gradient(90deg, #111 0, #000 100%);
    overflow-y: auto;
    font-size: 10px;
    font-family: "Courier New", Courier, monospace;
    padding: 5px;
    line-height: 16px;
    margin: 0;
  }

  undo {
    position: absolute;
    bottom: 8px;
    left: 10px;
    width: calc(100% - 95px);
    line-height: 14px;
    color: lightskyblue;
    background-color: rgba(0, 0, 0, 0.7);
    padding: 2px;
    font-size: 12px;
  }
</style>
