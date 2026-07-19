import { createElement } from "react";
import { reactGame } from "../reactHost";
import { Sudoku } from "./Sudoku";

export default reactGame(
  {
    id: "sudoku",
    title: { he: "סודוקו", en: "Sudoku" },
    emoji: "🔡",
    color: "#0984e3",
    ageBand: "all",
    category: "classics",
    orientation: "any",
    renderer: "dom",
  },
  (ctx) => createElement(Sudoku, { ctx }),
);
