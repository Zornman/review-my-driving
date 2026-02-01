import type { Db } from "mongodb";
import type { Actor } from "./http.js";

export type AuditEventEntityType = "truck" | "driver";
export type AuditEventAction =
  | "create"
  | "update"
  | "delete"
  | "assign_driver"
  | "unassign_driver";

export type AuditChange = {
  path: string;
  from: any;
  to: any;
};

export async function writeAuditEvent(params: {
  db: Db;
  businessId: any;
  entityType: AuditEventEntityType;
  entityId: any;
  entityKey?: string;
  action: AuditEventAction;
  actor: Actor;
  changes?: AuditChange[];
  requestId?: string;
}): Promise<void> {
  const {
    db,
    businessId,
    entityType,
    entityId,
    entityKey,
    action,
    actor,
    changes,
    requestId,
  } = params;

  await db.collection("audit_events").insertOne({
    businessId,
    entityType,
    entityId,
    entityKey: entityKey ?? null,
    action,
    at: new Date(),
    actor,
    changes: changes ?? [],
    requestId: requestId ?? null,
  });
}
