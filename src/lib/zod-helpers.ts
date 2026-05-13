import type { z } from "zod";

export type ParseOrErrorResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export function parseOrError<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): ParseOrErrorResult<z.infer<T>> {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { success: false, error: first?.message ?? "Validation failed" };
  }
  return { success: true, data: parsed.data };
}
