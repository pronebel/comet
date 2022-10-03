<script lang="ts">
  import { localStorageCommandsKey, Application } from "../application";
  import { getUserName } from "../sync/user";

  const app = Application.instance;
  const userName = getUserName();

  const commandList = JSON.parse(
    localStorage[localStorageCommandsKey] || "[]"
  ) as string[];

  const myCommandIndexes: number[] = [];
  commandList.forEach((command, i) => {
    if (command.split(":")[0] === userName) {
      myCommandIndexes.push(i);
    }
  });

  let selectedIndex = 0;

  function getMyCommandIndex(index: number) {
    return myCommandIndexes.findIndex((i) => i === index);
  }

  function isCurrentUser(index: number) {
    if (commandList.length === 0) {
      return false;
    }
    return getCommandInfo(index)[0] === userName;
  }

  function getCommandInfo(index: number) {
    return commandList[index].split(":");
  }

  function onClick(index: number) {
    selectedIndex = index;
    localStorage.setItem("replayIndex", String(selectedIndex));
  }

  function exec() {
    const command = commandList[selectedIndex];
    const commandName = command.split(":")[1];
    const myIndex = getMyCommandIndex(selectedIndex);

    if (commandName === "undo") {
      app.undo();
      return;
    }

    if (commandName === "redo") {
      app.redo();
      return;
    }

    app.undoStack.head = myIndex - 1;

    app.undoStack.apply();
  }

  function onRedo() {
    exec();
    selectedIndex = Math.min(commandList.length - 1, selectedIndex + 1);
    localStorage.setItem("replayIndex", String(selectedIndex));
  }

  setInterval(() => {
    const replayIndex = localStorage.getItem("replayIndex");
    if (replayIndex) {
      const index = parseInt(replayIndex as string);
      if (index !== selectedIndex) {
        selectedIndex = index;
      }
    }
  }, 250);
</script>

<div class={isCurrentUser(selectedIndex) ? "active" : ""}>
  {#if commandList.length > 0}
    <ul>
      {#each commandList as _command, i}
        <li
          class={`${i === selectedIndex ? "selected" : "unselected"} ${
            isCurrentUser(i) ? "self" : "other"
          }`}
          on:click={() => onClick(i)}
        >
          {getCommandInfo(i)[1]}
        </li>
      {/each}
    </ul>
    <button on:click={onRedo} disabled={!isCurrentUser(selectedIndex)}
      >Replay</button
    >
  {/if}
</div>

<style>
  div {
    position: fixed;
    right: 115px;
    background-color: #222;
    display: flex;
    flex-direction: column;
    border: 2px solid #666;
  }

  .active {
    border: 2px solid #21b2fe;
  }

  ul {
    flex-grow: 1;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li {
    padding: 0px 5px;
    color: white;
    font-size: 11px;
    text-align: center;
  }

  .selected {
    background-color: #365461;
    font-weight: bold;
  }

  .other {
    color: #666;
  }

  button {
    flex-grow: 0;
    font-size: 10px;
    background-color: #21b2fe;
    border: none;
    color: #252525;
    font-weight: bold;
    height: 20px;
    cursor: pointer;
  }

  button[disabled] {
    background-color: #666;
  }
</style>
