<script lang="ts">
  const hot = (import.meta as any).hot;
  if (hot) {
    hot.on("vite:beforeUpdate", () => {
      // full reload every time...
      hot.invalidate();
    });
  }
</script>
