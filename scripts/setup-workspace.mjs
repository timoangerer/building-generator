import { execFileSync } from "node:child_process";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readlinkSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

function runGit(args, cwd) {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
  }).trim();
}

function resolveCurrentRoot() {
  return process.env.WORKSPACE_SETUP_CURRENT_ROOT ?? runGit(["rev-parse", "--show-toplevel"], process.cwd());
}

function resolveParentRoot(currentRoot) {
  if (process.env.WORKSPACE_SETUP_PARENT_ROOT) {
    return process.env.WORKSPACE_SETUP_PARENT_ROOT;
  }

  const commonDirRaw = runGit(["rev-parse", "--git-common-dir"], currentRoot);
  const commonDir = path.resolve(currentRoot, commonDirRaw);

  if (path.basename(commonDir) !== ".git") {
    throw new Error(`Expected git common dir to end in .git, got: ${commonDir}`);
  }

  return path.dirname(commonDir);
}

function ensureIgnored(parentRoot) {
  const gitignorePath = path.join(parentRoot, ".gitignore");
  const entry = "/assets";
  const existing = existsSync(gitignorePath) ? readFileSync(gitignorePath, "utf8") : "";
  const lines = existing.split(/\r?\n/).map((line) => line.trim());

  if (lines.includes(entry) || lines.includes("assets")) {
    return false;
  }

  const next = existing.length === 0 ? `${entry}\n` : `${existing}${existing.endsWith("\n") ? "" : "\n"}${entry}\n`;
  writeFileSync(gitignorePath, next);
  return true;
}

function ensureAssetsDirectory(parentRoot) {
  const assetsPath = path.join(parentRoot, "assets");
  mkdirSync(assetsPath, { recursive: true });
  return assetsPath;
}

function ensureWorkspaceLink(currentRoot, targetPath) {
  const linkPath = path.join(currentRoot, "assets");

  if (!existsSync(linkPath)) {
    symlinkSync(targetPath, linkPath, "dir");
    return "created";
  }

  const stat = lstatSync(linkPath);
  if (!stat.isSymbolicLink()) {
    throw new Error(`Refusing to replace non-symlink path: ${linkPath}`);
  }

  const currentTarget = path.resolve(path.dirname(linkPath), readlinkSync(linkPath));
  if (currentTarget === targetPath) {
    return "unchanged";
  }

  unlinkSync(linkPath);
  symlinkSync(targetPath, linkPath, "dir");
  return "updated";
}

function main() {
  const currentRoot = path.resolve(resolveCurrentRoot());
  const parentRoot = path.resolve(resolveParentRoot(currentRoot));

  const gitignoreChanged = ensureIgnored(parentRoot);
  const assetsPath = ensureAssetsDirectory(parentRoot);

  if (currentRoot === parentRoot) {
    console.log(`Parent repo assets prepared at ${assetsPath}`);
    console.log(gitignoreChanged ? "Added /assets to parent .gitignore" : "Parent .gitignore already ignores assets");
    return;
  }

  const linkStatus = ensureWorkspaceLink(currentRoot, assetsPath);

  console.log(`Parent repo: ${parentRoot}`);
  console.log(`Workspace: ${currentRoot}`);
  console.log(gitignoreChanged ? "Added /assets to parent .gitignore" : "Parent .gitignore already ignores assets");
  console.log(linkStatus === "created" ? "Created assets symlink in workspace" : linkStatus === "updated" ? "Updated assets symlink in workspace" : "Assets symlink already correct");
}

main();
