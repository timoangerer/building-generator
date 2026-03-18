import React from "react";
import { createRoot } from "react-dom/client";
import { WorkbenchShell } from "./workbench-shell";
import "../index.css";

const root = createRoot(document.getElementById("root")!);
root.render(<WorkbenchShell />);
