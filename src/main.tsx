import { createRoot } from "react-dom/client";
import "@ui/index";
import { App } from "./portal/App";
import { registerSW } from "virtual:pwa-register";

// Register the service worker with a prompt update flow (a mid-game SW swap must
// not yank game chunks — the user is asked before we reload).
registerSW({ immediate: true });

const rootEl = document.getElementById("root");
if (rootEl) {
  createRoot(rootEl).render(<App />);
}
