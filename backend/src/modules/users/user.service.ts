import type { DocumentSnapshot } from "firebase-admin/firestore";
import { db, FieldValue } from "../../config/firebase.js";
import { env } from "../../config/env.js";
import {
  fromDoc,
  toDate,
  type RoleRecord,
  type UserRecord,
  type WithId
} from "../../lib/firestore.js";
import { HttpError } from "../../lib/http-error.js";
import { ALL_PERMISSIONS, type PermissionName } from "../../lib/permissions.js";
import { createInvitationToken } from "../../lib/security.js";
import { sendInvitationEmail } from "../../lib/mailer.js";

type AccessInput = {
  roleIds?: string[];
  permissionNames?: PermissionName[];
};

function userRef(id: string) {
  return db.collection("users").doc(id);
}

async function getRoles(roleIds: string[]) {
  const docs = await Promise.all(roleIds.map((roleId) => db.collection("roles").doc(roleId).get()));
  return docs
    .map((doc) => fromDoc(doc as DocumentSnapshot<RoleRecord>))
    .filter((role): role is WithId<RoleRecord> => Boolean(role));
}

async function roleByName(name: string) {
  const result = await db.collection("roles").where("name", "==", name).limit(1).get();
  return result.docs[0] ? fromDoc(result.docs[0] as DocumentSnapshot<RoleRecord>) : null;
}

function assertValidPermissions(permissionNames: string[]) {
  const allowed = new Set<string>(ALL_PERMISSIONS);
  if (permissionNames.some((permission) => !allowed.has(permission))) {
    throw new HttpError(400, "One or more permissions are invalid");
  }
}

async function resolveAccess(userId: string, access: AccessInput, useDefaultEmployeeRole = false) {
  const roleIds = new Set(access.roleIds ?? []);

  if (access.permissionNames) {
    assertValidPermissions(access.permissionNames);
    const existingCustomRole = await roleByName(`custom:${userId}`);
    const customRoleRef = existingCustomRole ? db.collection("roles").doc(existingCustomRole.id) : db.collection("roles").doc();
    await customRoleRef.set(
      {
        name: `custom:${userId}`,
        permissionNames: access.permissionNames,
        createdAt: existingCustomRole?.createdAt ?? FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      },
      { merge: true }
    );
    roleIds.add(customRoleRef.id);
  }

  if (roleIds.size === 0 && useDefaultEmployeeRole) {
    const employeeRole = await roleByName("employee");
    if (employeeRole) {
      roleIds.add(employeeRole.id);
    }
  }

  if (roleIds.size > 0) {
    const roles = await getRoles(Array.from(roleIds));
    if (roles.length !== roleIds.size) {
      throw new HttpError(400, "One or more roles are invalid");
    }
  }

  return Array.from(roleIds);
}

async function toUserDto(user: WithId<UserRecord>) {
  const roles = await getRoles(user.roleIds ?? []);
  const permissions = Array.from(new Set(roles.flatMap((role) => role.permissionNames)));

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: toDate(user.createdAt),
    updatedAt: toDate(user.updatedAt),
    invitationAccepted: Boolean(user.password),
    roles: roles.map((role) => ({ id: role.id, name: role.name })),
    permissions
  };
}

async function assertUniqueEmail(email: string, excludeId?: string) {
  const result = await db.collection("users").where("email", "==", email).limit(1).get();
  const existing = result.docs[0] ? fromDoc(result.docs[0] as DocumentSnapshot<UserRecord>) : null;
  if (existing && existing.id !== excludeId) {
    throw new HttpError(409, "A user with this email already exists");
  }
}

export async function listUsers() {
  const snapshot = await db.collection("users").get();
  const users = snapshot.docs
    .map((doc) => fromDoc(doc as DocumentSnapshot<UserRecord>))
    .filter((user): user is WithId<UserRecord> => Boolean(user))
    .sort((a, b) => toDate(b.createdAt)!.getTime() - toDate(a.createdAt)!.getTime());

  return Promise.all(users.map(toUserDto));
}

export async function listAssignees() {
  const snapshot = await db.collection("users").orderBy("name", "asc").get();
  return snapshot.docs
    .map((doc) => fromDoc(doc as DocumentSnapshot<UserRecord>))
    .filter((user): user is WithId<UserRecord> => Boolean(user))
    .map((user) => ({ id: user.id, name: user.name, email: user.email }));
}

export async function createUser(input: { name: string; email: string } & AccessInput, actorId: string) {
  await assertUniqueEmail(input.email);

  const invitation = createInvitationToken();
  const expiresAt = new Date(Date.now() + env.INVITATION_EXPIRES_HOURS * 60 * 60 * 1000);
  const createdRef = db.collection("users").doc();
  const roleIds = await resolveAccess(
    createdRef.id,
    {
      roleIds: input.roleIds,
      permissionNames: input.permissionNames
    },
    true
  );

  await db.runTransaction(async (tx) => {
    tx.create(createdRef, {
      name: input.name,
      email: input.email,
      password: null,
      roleIds,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });
    tx.create(db.collection("invitations").doc(), {
      tokenHash: invitation.tokenHash,
      userId: createdRef.id,
      expiresAt,
      acceptedAt: null,
      createdById: actorId,
      createdAt: FieldValue.serverTimestamp()
    });
  });

  const created = fromDoc((await createdRef.get()) as DocumentSnapshot<UserRecord>)!;
  const invitationUrl = `${env.APP_URL}/accept-invitation?token=${invitation.token}`;
  await sendInvitationEmail({ to: created.email, name: created.name, invitationUrl });

  return {
    user: await toUserDto(created),
    devInvitationUrl: env.NODE_ENV === "production" ? undefined : invitationUrl
  };
}

export async function updateUser(id: string, input: Partial<{ name: string; email: string } & AccessInput>) {
  const doc = await userRef(id).get();
  const existing = fromDoc(doc as DocumentSnapshot<UserRecord>);
  if (!existing) {
    throw new HttpError(404, "User not found");
  }

  if (input.email) {
    await assertUniqueEmail(input.email, id);
  }

  const nextRoleIds = input.roleIds || input.permissionNames ? await resolveAccess(id, input) : existing.roleIds;
  await userRef(id).update({
    name: input.name ?? existing.name,
    email: input.email ?? existing.email,
    roleIds: nextRoleIds,
    updatedAt: FieldValue.serverTimestamp()
  });

  return toUserDto(fromDoc((await userRef(id).get()) as DocumentSnapshot<UserRecord>)!);
}

export async function deleteUser(id: string, actorId: string) {
  if (id === actorId) {
    throw new HttpError(400, "You cannot delete your own account");
  }

  const doc = await userRef(id).get();
  if (!doc.exists) {
    throw new HttpError(404, "User not found");
  }

  await userRef(id).delete();
}

export async function resendInvitation(id: string, actorId: string) {
  const user = fromDoc((await userRef(id).get()) as DocumentSnapshot<UserRecord>);
  if (!user) {
    throw new HttpError(404, "User not found");
  }
  if (user.password) {
    throw new HttpError(400, "User has already accepted an invitation");
  }

  const invitation = createInvitationToken();
  const expiresAt = new Date(Date.now() + env.INVITATION_EXPIRES_HOURS * 60 * 60 * 1000);

  await db.collection("invitations").add({
    tokenHash: invitation.tokenHash,
    userId: id,
    expiresAt,
    acceptedAt: null,
    createdById: actorId,
    createdAt: FieldValue.serverTimestamp()
  });

  const invitationUrl = `${env.APP_URL}/accept-invitation?token=${invitation.token}`;
  await sendInvitationEmail({ to: user.email, name: user.name, invitationUrl });

  return {
    message: "Invitation sent",
    devInvitationUrl: env.NODE_ENV === "production" ? undefined : invitationUrl
  };
}
