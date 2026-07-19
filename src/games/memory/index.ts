import { createElement } from "react";
import { reactGame } from "../reactHost";
import { Memory } from "./Memory";

export default reactGame(
  {
    id: "memory",
    title: { he: "זיכרון", en: "Memory" },
    emoji: "🧠",
    color: "#fd79a8",
    ageBand: "kids",
    category: "kids",
    orientation: "any",
    renderer: "dom",
  },
  (ctx) => createElement(Memory, { ctx }),
);
