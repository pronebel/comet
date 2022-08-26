<script lang="ts">
  import { app } from "../app";
  import { DebugComponent } from "../../../core/lib/components/debug";
  import { Sprite, Texture } from "pixi.js";

  const createSprite = (color: number, x: number, y: number) => {
    const sprite = new Sprite(Texture.WHITE);
    sprite.tint = color;
    sprite.width = 20;
    sprite.height = 20;
    sprite.x = x;
    sprite.y = y;
    app.stage.addChild(sprite);
    return sprite;
  };

  const reparentSprite = (view: Sprite, newParentView: Sprite) => {
    view.updateTransform();
    newParentView.updateTransform();
    const viewMatrix = view.worldTransform.clone();
    newParentView.addChild(view);
    const parentMatrix = newParentView.worldTransform.clone();
    parentMatrix.invert();
    viewMatrix.prepend(parentMatrix);
    view.transform.setFromMatrix(viewMatrix);
  };

  // create 3 sprites equally spaced apart
  const a = createSprite(0xff0000, 20, 20);
  const b = createSprite(0x00ff00, 40, 40);
  const c = createSprite(0x0000ff, 60, 60);

  // without adjusting there matrix the sprites move and scale weirdly
  // as postion and scale are added from the parent matrix
  // a.addChild(b);
  // b.addChild(c);

  // adjusting there matrix fixes the issue, visually these should not change
  reparentSprite(b, a);
  reparentSprite(c, b);

  const onNewClick = () => {
    const component = new DebugComponent({
      x: 30,
      y: 30,
    });
    app.addComponent(component);
  };

  const onDeselectClick = () => {
    app.deselect();
  };

  const onCopyLinkedClick = () => {
    app.copy(true);
  };

  const onCopyUnLinkedClick = () => {
    app.copy(false);
  };

  const onRandColorClicked = () => {
    app.randColor();
  };

  const onRandSizeClicked = () => {
    app.randSize();
  };
</script>

<buttons>
  <button on:click={onNewClick}>New</button>
  <button on:click={onDeselectClick}>Deselect</button>
  <button on:click={onCopyLinkedClick}>Copy Linked</button>
  <button on:click={onCopyUnLinkedClick}>Copy UnLinked</button>
  <button on:click={onRandColorClicked}>Rand Color</button>
  <button on:click={onRandSizeClicked}>Rand Size</button>
</buttons>

<style>
  buttons {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 150px;
    display: flex;
    flex-direction: column;
  }
  buttons button {
    width: 100%;
    margin-bottom: 10px;
    font-size: 12pt;
  }
</style>
