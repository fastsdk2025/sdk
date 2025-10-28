import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { isCommandAvailable } from "./isCommandAvailable";

function getAvailableEditor(): string {
  if (process.env.EDITOR) {
    return process.env.EDITOR;
  }

  const editors = process.platform === "win32" ? ["notepad"] : ["nvim", "vim", "vi", "nano"];

  for (const editor of editors) {
    if (isCommandAvailable(editor)) {
      return editor
    }
  }

  throw new Error(`No text editor found. Please set the EDITOR environment variable or install one of: ${editors.join(", ")}.`);
}

export async function openEditorAndRead(
  title: string = "",
  filenamePrefix: string = "xyx-editor-",
): Promise<string> {
  const tmpFile = join(tmpdir(), `${filenamePrefix}-${randomUUID()}.txt`);

  await writeFile(tmpFile, title ? `# ${title}\n` : "", "utf8");

  const editor = getAvailableEditor()

  await new Promise<void>((resolve, reject) => {
    const child = spawn(editor, [tmpFile], { stdio: "inherit" });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${editor} exited with code ${code}`));
      }
    });

    child.on("error", reject);
  });

  let content = (await readFile(tmpFile, "utf8"))
    .split("\n")
    .filter((line: string) => !line.startsWith("#"))
    .join("\n")
    .trim();

  await rm(tmpFile);

  if (!/更新日志/.test(content)) {
    return `更新日志: \n${content}`;
  }

  return content;
}
