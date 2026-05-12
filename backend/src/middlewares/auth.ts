import type { NextFunction, Request, Response } from "express";
import type { DocumentSnapshot } from "firebase-admin/firestore";
import { db } from "../config/firebase.js";
import { fromDoc, type RoleRecord, type UserRecord } from "../lib/firestore.js";
import { HttpError } from "../lib/http-error.js";
import { verifyAccessToken } from "../lib/jwt.js";
import { hasPermission } from "../lib/permissions.js";

export async function buildUserContext(userId: string) {
  const user = fromDoc((await db.collection("users").doc(userId).get()) as DocumentSnapshot<UserRecord>);
  if (!user) {
    throw new HttpError(401, "Invalid authentication token");
  }

  const roleDocs = await Promise.all((user.roleIds ?? []).map((roleId) => db.collection("roles").doc(roleId).get()));
  const roleRecords = roleDocs
    .map((doc) => fromDoc(doc as DocumentSnapshot<RoleRecord>))
    .filter((role): role is RoleRecord & { id: string } => Boolean(role));
  const roles = roleRecords.map((role) => role.name);
  const permissions = Array.from(
    new Set(roleRecords.flatMap((role) => role.permissionNames))
  );

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    roles,
    permissions
  };
}

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

    if (!token) {
      throw new HttpError(401, "Authentication required");
    }

    const payload = verifyAccessToken(token);
    req.user = await buildUserContext(payload.sub);
    next();
  } catch (error) {
    next(error instanceof HttpError ? error : new HttpError(401, "Invalid or expired token"));
  }
}

export function requirePermission(...permissions: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new HttpError(401, "Authentication required"));
    }

    const allowed = permissions.length === 0 || permissions.some((permission) => hasPermission(req.user!.permissions, permission));
    if (!allowed) {
      return next(new HttpError(403, "You do not have permission to perform this action"));
    }

    return next();
  };
}
