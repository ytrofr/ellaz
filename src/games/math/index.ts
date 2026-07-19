import { createElement } from "react";
import { reactGame } from "../reactHost";
import { MathGame } from "./MathGame";

export default reactGame(
  {
    id: "math",
    title: { he: "חשבון", en: "Math" },
    emoji: "➕",
    color: "#00b894",
    ageBand: "kids",
    category: "kids",
    orientation: "any",
    renderer: "dom",
  },
  (ctx) => createElement(MathGame, { ctx }),
);
