import { createElement } from "react";
import { reactGame } from "../reactHost";
import { TicTacToe } from "./TicTacToe";

export default reactGame(
  {
    id: "tictactoe",
    title: { he: "איקס עיגול", en: "Tic-Tac-Toe" },
    emoji: "⭕",
    color: "#74b9ff",
    ageBand: "all",
    category: "classics",
    orientation: "any",
    renderer: "dom",
  },
  (ctx) => createElement(TicTacToe, { ctx }),
);
