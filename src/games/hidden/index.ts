import { createElement } from "react";
import { reactGame } from "../reactHost";
import { Hidden } from "./Hidden";

export default reactGame(
  {
    id: "hidden",
    title: { he: "מצא אותי", en: "Find Me" },
    emoji: "👀",
    color: "#a29bfe",
    ageBand: "kids",
    category: "kids",
    orientation: "any",
    renderer: "dom",
  },
  (ctx) => createElement(Hidden, { ctx }),
);
