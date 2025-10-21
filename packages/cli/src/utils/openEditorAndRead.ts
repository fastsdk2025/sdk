import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

export async function openEditorAndRead(
  title: string = "",
  filenamePrefix: string = "xyx-editor-",
): Promise<string> {
  const tmpFile = join(tmpdir(), `${filenamePrefix}-${randomUUID()}.txt`);

  await writeFile(tmpFile, title ? `# ${title}\n` : "", "utf8");

  const editor = process.env.EDITOR || "nvim";

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
