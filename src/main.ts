import { EasyStar, IPoint } from "easystarts";
import Phaser from "phaser";

class Test extends Phaser.Scene {
  private controls!: Phaser.Cameras.Controls.SmoothedKeyControl;
  private map!: Phaser.Tilemaps.Tilemap;
  private bottomLayer!: Phaser.Tilemaps.TilemapLayer;
  private midLayer!: Phaser.Tilemaps.TilemapLayer;
  private toplayer!: Phaser.Tilemaps.TilemapLayer;

  private marker!: Phaser.GameObjects.Sprite;
  private waypoint!: Phaser.GameObjects.Image;

  private guy!: Phaser.GameObjects.Sprite;
  private dTile!: Phaser.Tilemaps.Tile;
  private sTile!: Phaser.Tilemaps.Tile;

  private aStar: EasyStar;
  private path: IPoint[];

  private frameTime: number;
  readonly UPDATE_DELTA: number = 200;

  constructor() {
    super("test");

    this.aStar = new EasyStar();
    this.path = [];

    this.frameTime = 0;
  }

  preload() {
    this.load.image("marker", "assets/marker.png");
    this.load.image("charcter", "assets/charcter.png");
    this.load.image("waypoint", "assets/waypoint.png");

    this.load.image("tileset", "tiled/iso-64x64-outside.png");
    this.load.tilemapTiledJSON("map", "tiled/map.json");
  }

  create() {
    this.map = this.add.tilemap("map");
    const tileSet = this.map.addTilesetImage("tileset");
    this.bottomLayer = this.map.createLayer("Ground", tileSet);
    this.midLayer = this.map.createLayer("Tile Layer 1", tileSet);
    this.toplayer = this.map.createLayer("Tile Layer 2", tileSet);
    this.map.createLayer("Tile Layer 3", tileSet);

    this.waypoint = this.add.image(0, 0, "waypoint");
    this.waypoint.setOrigin(0, 1);
    this.waypoint.setVisible(false);

    this.marker = this.add.sprite(100, 100, "marker");
    this.marker.setOrigin(0, 1);

    this.sTile = this.bottomLayer.getTileAt(4, 16);

    this.guy = this.add.sprite(
      this.sTile.pixelX,
      this.sTile.pixelY + this.getDepth(this.sTile),
      "charcter"
    );
    this.guy.setOrigin(0, 1);

    this.map.createLayer("Boundry", tileSet);
    this.map.createLayer("AlwaysAbove-1", tileSet);
    this.map.createLayer("AlwaysAbove-2", tileSet);

    this.input.on(Phaser.Input.Events.POINTER_MOVE, this.onPointerMove);
    this.input.on(Phaser.Input.Events.POINTER_UP, this.onPointerUp);

    let grid: number[][] = [];
    let tile: Phaser.Tilemaps.Tile;
    for (let i = 0; i < this.map.width; i++) {
      let col: number[] = [];
      for (let j = 0; j < this.map.height; j++) {
        tile =
          this.toplayer.getTileAt(j, i) ||
          this.midLayer.getTileAt(j, i) ||
          this.bottomLayer.getTileAt(j, i);

        if (tile.properties.walkable) {
          col.push(0);
        } else col.push(1);
      }
      grid.push(col);
    }
    this.aStar.setGrid(grid);
    this.aStar.setAcceptableTiles([0]);

    var cursors = this.input.keyboard.createCursorKeys();

    var controlConfig = {
      camera: this.cameras.main,
      left: cursors.left,
      right: cursors.right,
      up: cursors.up,
      down: cursors.down,
      acceleration: 0.04,
      drag: 0.0005,
      maxSpeed: 0.7,
    };

    this.controls = new Phaser.Cameras.Controls.SmoothedKeyControl(
      controlConfig
    );
  }

  onPointerUp = (e: Phaser.Input.Pointer) => {
    if (this.marker.visible) {
      this.waypoint.setPosition(this.marker.x, this.marker.y);
      this.waypoint.setVisible(true);

      this.aStar.findPath(
        this.sTile.x,
        this.sTile.y,
        this.dTile.x,
        this.dTile.y,
        (path) => {
          if (path === null) {
            console.warn("Path was not found.");
          } else {
            this.path = path;
          }
        }
      );
      this.aStar.calculate();
    }
  };

  onPointerMove = (e: Phaser.Input.Pointer) => {
    const px = this.cameras.main.worldView.x + e.x - 32;
    const py = this.cameras.main.worldView.y + e.y;

    const tile = this.getTile(px, py, [
      this.bottomLayer,
      this.midLayer,
      this.toplayer,
    ]);

    if (tile && tile.properties.walkable) {
      this.marker.visible = true;
      this.marker.setPosition(tile.pixelX, tile.pixelY + this.getDepth(tile));
      this.dTile = tile;
    } else {
      this.marker.visible = false;
    }
  };

  getDepth(tile: Phaser.Tilemaps.Tile): number {
    if (tile.layer.name === this.bottomLayer.layer.name) return 64;
    if (tile.layer.name === this.midLayer.layer.name) return 32;
    else return 0;
  }

  getTile(
    x: number,
    y: number,
    layers: Phaser.Tilemaps.TilemapLayer[]
  ): Phaser.Tilemaps.Tile | undefined {
    if (layers.length === 0) return undefined;

    const layer = layers.pop()!;
    const tile: Phaser.Tilemaps.Tile = layer.getTileAtWorldXY(x, y);
    if (tile) return tile;
    else return this.getTile(x, y, layers);
  }

  getTileAt(
    iX: number,
    iY: number,
    layers: Phaser.Tilemaps.TilemapLayer[]
  ): Phaser.Tilemaps.Tile | undefined {
    if (layers.length === 0) return undefined;

    const layer = layers.pop()!;
    const tile: Phaser.Tilemaps.Tile = layer.getTileAt(iX, iY);
    if (tile) return tile;
    else return this.getTileAt(iX, iY, layers);
  }

  update(time: number, delta: number): void {
    this.controls.update(delta);
    this.frameTime += delta;
    if (this.frameTime > this.UPDATE_DELTA) {
      this.frameTime = 0;
      if (this.path.length > 0) {
        const point: IPoint = this.path.shift()!;
        const tile = this.getTileAt(point.x, point.y, [
          this.bottomLayer,
          this.midLayer,
          this.toplayer,
        ]);
        if (tile) {
          this.sTile = tile;
          this.guy.setPosition(tile.pixelX, tile.pixelY + this.getDepth(tile));
        }
      }
    }
  }
}
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  pixelArt: true,
  scene: Test,
};

export default new Phaser.Game(config);
