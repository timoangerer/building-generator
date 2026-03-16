import React from "react";
import { createRoot } from "react-dom/client";
import { GalleryShell } from "./gallery-shell";
import "../index.css";

const root = createRoot(document.getElementById("root")!);
root.render(<GalleryShell />);
