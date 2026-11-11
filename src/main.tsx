import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/components.css";

const container = document.getElementById("root");
if (container === null) {
  throw new Error("Root element not found");
}

createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
