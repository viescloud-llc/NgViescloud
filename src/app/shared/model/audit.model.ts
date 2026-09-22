// Change history — GET /api/v1/audit (authority `audit:read`).
export interface ChangeLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;             // CREATE | UPDATE | DELETE | REFUND | CAPTURE | CANCEL | RESTOCK | …
  actorUserId?: string | null;
  actorName?: string | null;
  at: string;                 // ISO instant
  summary?: string | null;
  diff?: string | null;       // JSON {field: {from, to}}
  label?: string | null;
}

export interface ChangeLogDiffEntry {
  field: string;
  from: string | null;
  to: string | null;
}

export function parseDiff(c: ChangeLog): ChangeLogDiffEntry[] {
  if (!c.diff) return [];
  try {
    const obj = JSON.parse(c.diff) as Record<string, { from?: string | null; to?: string | null }>;
    return Object.entries(obj).map(([field, v]) => ({ field, from: v?.from ?? null, to: v?.to ?? null }));
  } catch {
    return [];
  }
}
