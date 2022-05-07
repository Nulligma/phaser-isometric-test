import Phaser from "phaser";

import HelloWorldScene from "./scenes/HelloWorldScene";

class Test extends Phaser.Scene {
  constructor() {
    super("test");
  }

  preload() {
    this.load.image("house", "assets/rem_0002.png");
  }

  create() {
    this.add.sprite(100, 100, "house");
    this.scene.start("hello-world");
  }
}
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 200 },
    },
  },
  scene: [Test, HelloWorldScene],
};

export default new Phaser.Game(config);
