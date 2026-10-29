import {createRoot} from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Register Service Worker for true Offline capability
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        reg.onupdatefound = () => {
          const installingWorker = reg.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
                console.log("Personal Hub: App cached and ready for offline use.");
              }
            };
          }
        };
      })
      .catch((err) => {
        console.warn("Service worker registration failed:", err);
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
