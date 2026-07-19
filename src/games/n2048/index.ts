import { createElement } from "react";
import { reactGame } from "../reactHost";
import { Game2048 } from "./Game2048";

export default reactGame(
  {
    id: "2048",
    title: { he: "2048", en: "2048" },
    emoji: "🔢",
    color: "#edc22e",
    ageBand: "all",
    category: "classics",
    orientation: "any",
    renderer: "dom",
  },
  (ctx) => createElement(Game2048, { ctx }),
);
