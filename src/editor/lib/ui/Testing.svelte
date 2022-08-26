<script lang="ts">
  import { app } from "../app";
  import { DebugComponent } from "../../../core/lib/components/debug";
  import { Sprite, Texture } from "pixi.js";

  const createSprite = (
    color: number,
    x: number,
    y: number,
    parent?: Sprite
  ) => {
    const sprite = new Sprite(Texture.WHITE);
    sprite.tint = color;
    sprite.width = 20;
    sprite.height = 20;
    sprite.x = x;
    sprite.y = y;
    app.stage.addChild(sprite);

    if (parent) {
      parent.addChild(sprite);

      parent.updateTransform();
      sprite.updateTransform();

      const viewMatrix = sprite.worldTransform.clone();

      const parentMatrix = parent.worldTransform.clone();

      parentMatrix.invert();
      viewMatrix.prepend(parentMatrix);

      sprite.transform.setFromMatrix(viewMatrix);
    }

    return sprite;
  };

  const a = createSprite(0xff0000, 20, 20);
  const b = createSprite(0x00ff00, 20, 20, a);
  createSprite(0x0000ff, 20, 20, b);

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
