import { z } from "zod";

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export function getPagination(query: Record<string, any>) {
  const parsed = paginationSchema.safeParse(query);
  const page = parsed.success ? parsed.data.page : 1;
  const limit = parsed.success ? parsed.data.limit : 20;
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

export function withArchivedFilter(clauses: string[]) {
  return ["archived_at IS NULL", ...clauses].filter(Boolean).join(" AND ");
}
