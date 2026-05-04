import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { applyThemeToDocument, readStoredTheme } from "lib/theme-storage";
import "./index.css";
import App from "./App.tsx";

applyThemeToDocument(readStoredTheme());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
