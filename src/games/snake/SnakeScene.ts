import Phaser from "phaser";
import type { GameContext } from "@sdk/index";
import { celebrate } from "@juice/index";
import { newGame, step, turn, type SnakeState, type Dir } from "./logic";

const COLS = 17;
const ROWS = 17;
const STEP_MS = 130; // tick rate

type Phase = "ready" | "playing" | "over";

// Phaser scene: draws the pure SnakeState and feeds it input. The snake does not
// move until the player's first input (ready → playing), so it never dies before
// they're looking. All game rules live in logic.ts; this class is render + input.
export class SnakeScene extends Phaser.Scene {
  private ctx!: GameContext;
  private state!: SnakeState;
  private phase: Phase = "ready";
  private cell = 20;
  private acc = 0;
  private gfx!: Phaser.GameObjects.Graphics;
  private scoreText!: Phaser.GameObjects.Text;
  private overText!: Phaser.GameObjects.Text;

  constructor() {
    super("snake");
  }

  init(data: { ctx: GameContext }) {
    this.ctx = data.ctx;
  }

  create() {
    this.state = newGame(COLS, ROWS);
    this.phase = "ready";
    this.computeCell();
    this.gfx = this.add.graphics();
    this.scoreText = this.add
      .text(8, 6, "0", { fontFamily: "Heebo, sans-serif", fontSize: "20px", color: "#ffffff" })
      .setDepth(10);
    this.overText = this.add
      .text(this.scale.width / 2, this.scale.height / 2, "", {
        fontFamily: "Fredoka, sans-serif",
        fontSize: "24px",
        color: "#ffffff",
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(10);

    this.ctx.lifecycle.gameplayStart();
    this.ctx.analytics.levelStart("classic");

    this.input.keyboard?.on("keydown", (e: KeyboardEvent) => {
      const map: Record<string, Dir> = {
        ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
        w: "up", s: "down", a: "left", d: "right",
      };
      const dir = map[e.key];
      this.ctx.audio.unlock();
      if (this.phase === "over") {
        this.restart();
        return;
      }
      if (dir) {
        if (this.phase === "ready") this.phase = "playing";
        this.state = turn(this.state, dir);
      } else if (this.phase === "ready") {
        this.phase = "playing";
      }
    });

    // Swipe via pointer; a plain tap starts the game (or restarts after game over).
    let sx = 0, sy = 0;
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      sx = p.x;
      sy = p.y;
      this.ctx.audio.unlock();
      if (this.phase === "over") this.restart();
    });
    this.input.on("pointerup", (p: Phaser.Input.Pointer) => {
      const dx = p.x - sx;
      const dy = p.y - sy;
      if (Math.abs(dx) < 18 && Math.abs(dy) < 18) {
        if (this.phase === "ready") this.phase = "playing"; // tap = start
        return;
      }
      if (this.phase === "ready") this.phase = "playing";
      if (this.phase === "playing") {
        this.state =
          Math.abs(dx) > Math.abs(dy)
            ? turn(this.state, dx > 0 ? "right" : "left")
            : turn(this.state, dy > 0 ? "down" : "up");
      }
    });

    this.scale.on("resize", () => this.computeCell());
    this.draw();
  }

  private computeCell() {
    this.cell = Math.floor(Math.min(this.scale.width, this.scale.height) / COLS);
  }

  private restart() {
    this.state = newGame(COLS, ROWS);
    this.phase = "ready";
    this.acc = 0;
    this.ctx.analytics.levelStart("classic");
    this.draw();
  }

  update(_time: number, delta: number) {
    if (this.phase !== "playing") return;
    this.acc += delta;
    while (this.acc >= STEP_MS) {
      this.acc -= STEP_MS;
      const prevScore = this.state.score;
      this.state = step(this.state);
      if (this.state.score > prevScore) {
        this.ctx.audio.play("success");
        if (this.state.score % 5 === 0) celebrate({ count: 40 }); // reward milestone
      }
      if (!this.state.alive) {
        this.phase = "over";
        this.ctx.audio.play("fail");
        this.ctx.analytics.levelFail("classic", "collision");
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
    // Keep the overlay off the snake's spawn row.
    this.overText.setPosition(this.scale.width / 2, this.scale.height * 0.28);
    const he = this.ctx.locale === "he";
    if (this.phase === "ready") {
      this.overText.setText(he ? "הקישו כדי להתחיל" : "Tap to start");
    } else if (this.phase === "over") {
      this.overText.setText(
        (he ? "המשחק נגמר" : "Game over") +
          `\n${this.ctx.t("score")}: ${this.state.score}\n` +
          (he ? "הקישו לשחק שוב" : "Tap to play again"),
      );
    } else {
      this.overText.setText("");
    }
  }
}
