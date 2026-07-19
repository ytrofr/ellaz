import Phaser from "phaser";
import type { GameContext } from "@sdk/index";
import { newGame, step, turn, type SnakeState, type Dir } from "./logic";

const COLS = 17;
const ROWS = 17;
const STEP_MS = 130; // tick rate

// Phaser scene: draws the pure SnakeState and feeds it input. All game rules
// live in logic.ts; this class is render + input only.
export class SnakeScene extends Phaser.Scene {
  private ctx!: GameContext;
  private state!: SnakeState;
  private cell = 20;
  private acc = 0;
  private gfx!: Phaser.GameObjects.Graphics;
  private scoreText!: Phaser.GameObjects.Text;
  private overText!: Phaser.GameObjects.Text;
  private onScore?: (n: number) => void;

  constructor() {
    super("snake");
  }

  init(data: { ctx: GameContext; onScore?: (n: number) => void }) {
    this.ctx = data.ctx;
    this.onScore = data.onScore;
  }

  create() {
    this.state = newGame(COLS, ROWS);
    this.computeCell();
    this.gfx = this.add.graphics();
    this.scoreText = this.add
      .text(8, 6, "0", { fontFamily: "Heebo, sans-serif", fontSize: "20px", color: "#ffffff" })
      .setDepth(10);
    this.overText = this.add
      .text(this.scale.width / 2, this.scale.height / 2, "", {
        fontFamily: "Fredoka, sans-serif",
        fontSize: "28px",
        color: "#ffffff",
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(10);

    this.ctx.lifecycle.gameplayStart();
    this.ctx.analytics.levelStart("classic");

    // Keyboard.
    this.input.keyboard?.on("keydown", (e: KeyboardEvent) => {
      const map: Record<string, Dir> = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
        w: "up",
        s: "down",
        a: "left",
        d: "right",
      };
      const dir = map[e.key];
      if (dir) this.state = turn(this.state, dir);
    });

    // Swipe via pointer.
    let sx = 0,
      sy = 0;
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      sx = p.x;
      sy = p.y;
      this.ctx.audio.unlock();
    });
    this.input.on("pointerup", (p: Phaser.Input.Pointer) => {
      const dx = p.x - sx;
      const dy = p.y - sy;
      if (Math.abs(dx) < 18 && Math.abs(dy) < 18) return;
      if (Math.abs(dx) > Math.abs(dy)) this.state = turn(this.state, dx > 0 ? "right" : "left");
      else this.state = turn(this.state, dy > 0 ? "down" : "up");
    });

    this.scale.on("resize", () => this.computeCell());
    this.draw();
  }

  private computeCell() {
    this.cell = Math.floor(Math.min(this.scale.width, this.scale.height) / COLS);
  }

  private restart() {
    this.state = newGame(COLS, ROWS);
    this.overText.setText("");
    this.ctx.analytics.levelStart("classic");
  }

  update(_time: number, delta: number) {
    if (!this.state.alive) return;
    this.acc += delta;
    while (this.acc >= STEP_MS) {
      this.acc -= STEP_MS;
      const prevScore = this.state.score;
      this.state = step(this.state);
      if (this.state.score > prevScore) {
        this.ctx.audio.play("success");
        this.onScore?.(this.state.score);
      }
      if (!this.state.alive) {
        this.ctx.audio.play("fail");
        this.ctx.analytics.levelFail("classic", "collision");
        this.overText.setText(`${this.ctx.t("gameOver")}\n${this.ctx.t("score")}: ${this.state.score}`);
        // tap to restart
        this.input.once("pointerdown", () => this.restart());
        this.input.keyboard?.once("keydown", () => this.restart());
      }
      this.draw();
    }
  }

  private draw() {
    const g = this.gfx;
    const c = this.cell;
    const boardW = COLS * c;
    const boardH = ROWS * c;
    const ox = Math.floor((this.scale.width - boardW) / 2);
    const oy = Math.floor((this.scale.height - boardH) / 2);
    g.clear();
    // board: lighter fill + border so the play area reads clearly against the page
    g.fillStyle(0x1e2240, 1).fillRoundedRect(ox - 6, oy - 6, boardW + 12, boardH + 12, 12);
    g.lineStyle(3, 0x6c5ce7, 1).strokeRoundedRect(ox - 6, oy - 6, boardW + 12, boardH + 12, 12);
    // subtle grid
    g.lineStyle(1, 0x2a2f58, 0.6);
    for (let i = 1; i < COLS; i++) {
      g.lineBetween(ox + i * c, oy, ox + i * c, oy + boardH);
      g.lineBetween(ox, oy + i * c, ox + boardW, oy + i * c);
    }
    // food
    g.fillStyle(0xff7675, 1).fillCircle(
      ox + this.state.food.x * c + c / 2,
      oy + this.state.food.y * c + c / 2,
      c * 0.38,
    );
    // snake
    this.state.body.forEach((p, i) => {
      const color = i === 0 ? 0x55efc4 : 0x00cec9;
      g.fillStyle(color, 1).fillRoundedRect(ox + p.x * c + 1, oy + p.y * c + 1, c - 2, c - 2, 5);
    });
    this.scoreText.setText(`${this.ctx.t("score")}: ${this.state.score}`);
    this.overText.setPosition(this.scale.width / 2, this.scale.height / 2);
  }
}
