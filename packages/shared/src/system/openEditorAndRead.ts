import { join } from "node:path"
import { tmpdir } from "node:os"
import { randomUUID } from "node:crypto"
import { writeFile } from "node:fs/promises"
import {getAvailableEditor} from "@/system/getAvailableEditor.ts";
import { spawn } from "node:child_process"

export async function openEditorAndRead(
  title: string = "",
  filenamePrefix: string = "editor"
) {
  const tmpFile = join(tmpdir(), `${filenamePrefix}-${randomUUID()}.txt`)

  await writeFile(tmpFile, title ? `# ${title}\n` : "", "utf-8")

  const editor = getAvailableEditor()

  await new Promise<void>((resolve, reject) => {
    const child = spawn(editor, [tmpFile], { stdio: "inherit" })

    child.on("exit", (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`${editor} exited with code ${code}`))
      }
    })

    child.on("error", reject)
  })
}