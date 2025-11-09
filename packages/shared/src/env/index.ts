import { ZodType } from "zod"

export function parseEnv<T>(
  scheme: ZodType<T>,
  raw: Record<string, string | undefined> = process.env
): T {
  const parsed = scheme.safeParse(raw)
  if (parsed.error) {
    throw parsed.error
  }

  return parsed.data
}