import type { Request } from "express";
import { ObjectId } from "mongodb";

export type Actor = {
  userId: string;
  name?: string;
};

export function parseJsonBody<T = any>(req: Request): T {
  const body: any = (req as any).body;
  if (body == null) return {} as T;
  if (typeof body === "string") {
    return JSON.parse(body) as T;
  }
  return body as T;
}

export function getActor(input: any): Actor {
  const actor = input?.actor;
  if (!actor || typeof actor.userId !== "string" || actor.userId.trim() === "") {
    return { userId: "unknown" };
  }
  return { userId: actor.userId, name: typeof actor.name === "string" ? actor.name : undefined };
}

export function isValidObjectIdString(value: any): value is string {
  return typeof value === "string" && /^[a-fA-F0-9]{24}$/.test(value);
}

export function toObjectId(value: any, fieldName: string): ObjectId {
  if (value instanceof ObjectId) return value;
  if (isValidObjectIdString(value)) return new ObjectId(value);
  throw new Error(`Invalid ${fieldName}: expected 24-char hex string`);
}

export function normalizeBusinessId(value: any, asObjectId?: boolean): string | ObjectId {
  if (asObjectId) return toObjectId(value, "businessId");
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error("businessId is required");
  }
  return value;
}

export function getDeep(obj: any, path: string): any {
  return path.split(".").reduce((acc: any, key: string) => (acc == null ? undefined : acc[key]), obj);
}
