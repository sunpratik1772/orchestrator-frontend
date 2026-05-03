import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { applyBackend } from "@/lib/apiBase";

document.documentElement.classList.add("dark");

// Apply the user's chosen backend (TS or Python) before any query runs.
applyBackend();

createRoot(document.getElementById("root")!).render(<App />);
