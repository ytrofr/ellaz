// Math quiz — pure logic. Addition and subtraction where every operand, and the
// answer, stays within 0..10 (age-5 friendly). Deterministic given a RNG. No DOM.
export type Op = "+" | "-";

export interface Problem {
  a: number;
  b: number;
  op: Op;
  answer: number;
  choices: number[]; // the correct answer plus distractors, shuffled
}

const MAX = 10;
const N_CHOICES = 3;

function randInt(min: number, max: number, rng: () => number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Build `n` wrong answers within 0..MAX, preferring numbers near the answer so the
// choices feel plausible.
function distractors(answer: number, n: number, rng: () => number): number[] {
  const near = [answer - 2, answer - 1, answer + 1, answer + 2].filter(
    (v) => v >= 0 && v <= MAX && v !== answer,
  );
  const far = [];
  for (let v = 0; v <= MAX; v++) if (v !== answer && !near.includes(v)) far.push(v);
  const pool = [...shuffle(near, rng), ...shuffle(far, rng)];
  const out: number[] = [];
  for (const v of pool) {
    if (out.length >= n) break;
    if (!out.includes(v)) out.push(v);
  }
  return out;
}

export function generateProblem(rng: () => number = Math.random): Problem {
  const op: Op = rng() < 0.5 ? "+" : "-";
  let a: number, b: number, answer: number;
  if (op === "+") {
    a = randInt(0, MAX, rng);
    b = randInt(0, MAX - a, rng); // a + b <= 10
    answer = a + b;
  } else {
    a = randInt(0, MAX, rng);
    b = randInt(0, a, rng); // a - b >= 0
    answer = a - b;
  }
  const choices = shuffle([answer, ...distractors(answer, N_CHOICES - 1, rng)], rng);
  return { a, b, op, answer, choices };
}

export function isCorrect(problem: Problem, choice: number): boolean {
  return choice === problem.answer;
}
