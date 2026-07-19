import { createElement } from "react";
import { reactGame } from "../reactHost";
import { Coloring } from "./Coloring";

export default reactGame(
  {
    id: "coloring",
    title: { he: "צביעה", en: "Coloring" },
    emoji: "🎨",
    color: "#ffa94d",
    ageBand: "kids",
    category: "kids",
    orientation: "any",
    renderer: "dom",
  },
  (ctx) => createElement(Coloring, { ctx }),
);
