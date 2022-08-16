<script lang="ts">
  import { app } from "./app";
  import { DebugComponent } from "../core/components/debug";

  const foo1 = new DebugComponent({
    id: "foo1",
  });

  const foo2 = foo1.copy();
  foo2.model.id = "foo2";

  const foo3 = new DebugComponent(
    {
      id: "foo3",
      color: 0x0000ff,
    },
    foo2
  );

  foo1.on("modified", (k, v, ov) => console.log("foo1:modified", k, v, ov));
  foo2.on("modified", (k, v, ov) => console.log("foo2:modified", k, v, ov));
  foo3.on("modified", (k, v, ov) => console.log("foo3:modified", k, v, ov));

  (window as any).foo1 = foo1;
  (window as any).foo2 = foo2;
  (window as any).foo3 = foo3;

  app.stage.addChild(foo1.view);
  app.stage.addChild(foo2.view);
  app.stage.addChild(foo3.view);

  foo2.model.color = 0x00ff00;
  foo2.model.x = 50;
  foo1.model.y = 50;
  foo3.model.y = 100;

  console.log(foo1.model.values);
  console.log(foo2.model.values);
  console.log(foo3.model.values);
</script>
