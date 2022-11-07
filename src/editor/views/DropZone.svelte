<script lang="ts" context="module">
  function preventDefaults(e: Event) {
    e.preventDefault();
    e.stopPropagation();
  }
  ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
    document.body.addEventListener(eventName, preventDefaults, false);
  });
</script>

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
    const { dataTransfer } = e;
    if (dataTransfer) {
      var files = dataTransfer.files;
      console.log("drop", files);
    }
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
