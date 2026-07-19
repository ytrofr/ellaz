import { createElement } from "react";
import { reactGame } from "../reactHost";
import { FindDiff } from "./FindDiff";

export default reactGame(
  {
    id: "finddiff",
    title: { he: "מצא הבדלים", en: "Find Differences" },
    emoji: "🔍",
    color: "#00cec9",
    ageBand: "kids",
    category: "kids",
    orientation: "any",
    renderer: "dom",
  },
  (ctx) => createElement(FindDiff, { ctx }),
);
