import { readdirSync, statSync } from "node:fs"
import {join, resolve} from "node:path";

interface WalKOptions {
  recursive?: boolean;
}

const defaultOptions: WalKOptions = {
  recursive: false,
}

export function* walkSync(
  base: string,
  options: WalKOptions = {}
) {
  const opts = { ...defaultOptions, ...options }
  const root = resolve(base)

}