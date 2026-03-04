import type { FastifyReply } from "fastify";
import { z } from "zod";
import { ApiErrorDTO } from "@aeria/shared";

export function parseQuery<T>(
  reply: FastifyReply,
  schema: z.ZodType<T, z.ZodTypeDef, unknown>,
  query: unknown
): T | null {
  const parsed = schema.safeParse(query);
  if (parsed.success) {
    return parsed.data;
  }

  reply.code(400);
  return null;
}

export function withArchivedFilter(clauses: string[]) {
  return ["archived_at IS NULL", ...clauses].filter(Boolean).join(" AND ");
}

export function toNullableIsoDateTime(value: unknown): string | null {
  if (!value) return null;

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "string") {
    return new Date(value).toISOString();
  }

  return null;
}

export function validateResponse<T>(schema: z.ZodType<T>, payload: unknown, routeId: string): T {
  const parsed = schema.safeParse(payload);
  if (parsed.success) {
    return parsed.data;
  }

  throw new Error(`Response validation failed for ${routeId}: ${parsed.error.message}`);
}

export function errorPayload(message: string) {
  return validateResponse(ApiErrorDTO, { error: message }, "error");
}
