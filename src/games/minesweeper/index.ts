import { createElement } from "react";
import { reactGame } from "../reactHost";
import { Minesweeper } from "./Minesweeper";

export default reactGame(
  {
    id: "minesweeper",
    title: { he: "שולה מוקשים", en: "Minesweeper" },
    emoji: "💣",
    color: "#636e72",
    ageBand: "all",
    category: "classics",
    orientation: "any",
    renderer: "dom",
  },
  (ctx) => createElement(Minesweeper, { ctx }),
);
