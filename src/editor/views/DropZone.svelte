<script lang="ts">
  const onDragStart = (e: DragEvent) => {
    const { dataTransfer } = e;
    if (dataTransfer) {
      const d = dataTransfer.getData("application/x-moz-file");
      dataTransfer.setData("application/x-moz-file", d);

      dataTransfer.dropEffect = "move";
      console.log("start", d);
    }
  };

  const onDragLeave = (e: DragEvent) => {
    console.log("leave", e);
  };

  const onDragDrop = (e: DragEvent) => {
    e.preventDefault();
    alert("!");
    console.log("drop", e);
  };
</script>

<div
  on:dragenter={onDragStart}
  on:dragleave={onDragLeave}
  on:drop={onDragDrop}
  draggable="true"
  class="fill"
  data-section="dragzone">
  <slot />
</div>

<style>
  [data-section="dragzone"] {
  }
</style>
