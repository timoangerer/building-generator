import { readdir } from "node:fs/promises";
import { resolve } from "node:path";

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp"]);

export async function check() {
  const root = resolve(import.meta.dirname, "..", "..");
  const entries = await readdir(root);

  const images = entries.filter((name) => {
    const dot = name.lastIndexOf(".");
    return dot !== -1 && IMAGE_EXTENSIONS.has(name.slice(dot).toLowerCase());
  });

  if (images.length === 0) {
    return { ok: true, messages: [] };
  }

  return {
    ok: false,
    messages: [
      `Image file(s) found in the project root: ${images.join(", ")}`,
      `FIX: Delete these files. Screenshots and images must not be committed`,
      `to the repository root. If an image is needed for documentation, place it`,
      `in docs/ or a relevant subdirectory. If it was created for debugging,`,
      `remove it before committing.`,
    ],
  };
}
