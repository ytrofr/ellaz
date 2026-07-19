import Phaser from "phaser";
import type { GameContext } from "@sdk/index";
import { celebrate } from "@juice/index";
import { newGame, step, turn, type SnakeState, type Dir } from "./logic";

const COLS = 17;
const ROWS = 17;

// Base tick rates (ms/step) the player picks on the ready screen.
type SpeedKey = "slow" | "normal" | "fast";
const SPEEDS: Record<SpeedKey, number> = { slow: 170, normal: 130, fast: 90 };

// Progressive difficulty: every FOOD_PER_LEVEL food eaten bumps the level; each
// level shaves STEP_DECAY_MS off the effective tick, never faster than STEP_FLOOR.
const FOOD_PER_LEVEL = 5;
const STEP_DECAY_MS = 8;
const STEP_FLOOR = 60;

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
  // Base speed the player selected; persists across restarts within the session.
  private selectedSpeed: SpeedKey = "normal";
  private baseStepMs = SPEEDS.normal;
  private gfx!: Phaser.GameObjects.Graphics;
  private scoreText!: Phaser.GameObjects.Text;
  private overText!: Phaser.GameObjects.Text;
  private speedButtons: Phaser.GameObjects.Text[] = [];

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
        this.startPlaying(); // first arrow starts at the selected speed
        this.state = turn(this.state, dir);
      } else {
        this.startPlaying();
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
        this.startPlaying(); // tap = start at the selected (default normal) speed
        return;
      }
      this.startPlaying();
      if (this.phase === "playing") {
        this.state =
          Math.abs(dx) > Math.abs(dy)
            ? turn(this.state, dx > 0 ? "right" : "left")
            : turn(this.state, dy > 0 ? "down" : "up");
      }
    });

    this.scale.on("resize", () => {
      this.computeCell();
      if (this.phase === "ready") this.showSpeedButtons(); // reposition at new size
    });
    this.draw();
    this.showSpeedButtons();
  }

  private computeCell() {
    this.cell = Math.floor(Math.min(this.scale.width, this.scale.height) / COLS);
  }

  // Current level (1-based) and the effective tick after progressive speed-up.
  private level(): number {
    return 1 + Math.floor(this.state.score / FOOD_PER_LEVEL);
  }
  private effectiveStep(): number {
    return Math.max(STEP_FLOOR, this.baseStepMs - (this.level() - 1) * STEP_DECAY_MS);
  }

  // Single entry for every ready → playing transition; hides the speed picker.
  private startPlaying() {
    if (this.phase !== "ready") return;
    this.phase = "playing";
    this.hideSpeedButtons();
  }

  // Lock in a base speed and start. Selection persists for later restarts.
  private selectSpeed(key: SpeedKey) {
    this.selectedSpeed = key;
    this.baseStepMs = SPEEDS[key];
    this.startPlaying();
  }

  private showSpeedButtons() {
    this.hideSpeedButtons();
    const he = this.ctx.locale === "he";
    const opts: { key: SpeedKey; label: string }[] = [
      { key: "slow", label: he ? "🐢 איטי" : "🐢 Slow" },
      { key: "normal", label: he ? "🙂 רגיל" : "🙂 Normal" },
      { key: "fast", label: he ? "🐇 מהיר" : "🐇 Fast" },
    ];
    const cx = this.scale.width / 2;
    const startY = this.scale.height * 0.46;
    const gap = Math.max(40, this.scale.height * 0.12);
    opts.forEach((o, i) => {
      const selected = o.key === this.selectedSpeed;
      const btn = this.add
        .text(cx, startY + i * gap, o.label, {
          fontFamily: "Fredoka, sans-serif",
          fontSize: "20px",
          color: selected ? "#0f1226" : "#ffffff",
          backgroundColor: selected ? "#55efc4" : "#2a2f58",
          padding: { x: 16, y: 8 },
        })
        .setOrigin(0.5)
        .setDepth(20)
        .setInteractive({ useHandCursor: true });
      btn.on("pointerdown", () => {
        this.ctx.audio.unlock();
        this.selectSpeed(o.key);
      });
      this.speedButtons.push(btn);
    });
  }

  private hideSpeedButtons() {
    this.speedButtons.forEach((b) => b.destroy());
    this.speedButtons = [];
  }

  private restart() {
    this.state = newGame(COLS, ROWS);
    this.phase = "ready";
    this.acc = 0;
    // NB: baseStepMs / selectedSpeed intentionally kept — speed persists across restarts.
    this.ctx.analytics.levelStart("classic");
    this.draw();
    this.showSpeedButtons();
  }

  update(_time: number, delta: number) {
    if (this.phase !== "playing") return;
    this.acc += delta;
    const stepMs = this.effectiveStep();
    while (this.acc >= stepMs) {
      this.acc -= stepMs;
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
    const he = this.ctx.locale === "he";
    const levelLabel = he ? "רמה" : "Level";
    this.scoreText.setText(
      `${this.ctx.t("score")}: ${this.state.score}   ${levelLabel} ${this.level()}`,
    );
    // Keep the overlay off the snake's spawn row.
    this.overText.setPosition(this.scale.width / 2, this.scale.height * 0.28);
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
