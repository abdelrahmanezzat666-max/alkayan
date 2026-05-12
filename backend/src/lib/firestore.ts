import type { DocumentSnapshot, QueryDocumentSnapshot, Timestamp as FirestoreTimestamp } from "firebase-admin/firestore";

export type DbDate = Date | FirestoreTimestamp;

export type UserRecord = {
  name: string;
  email: string;
  password?: string | null;
  roleIds: string[];
  createdAt: DbDate;
  updatedAt: DbDate;
};

export type RoleRecord = {
  name: string;
  permissionNames: string[];
  createdAt: DbDate;
  updatedAt: DbDate;
};

export type PermissionRecord = {
  name: string;
};

export type CityRecord = {
  name: string;
  createdAt: DbDate;
  updatedAt: DbDate;
};

export type PropertyRecord = {
  operationType: "sale" | "rent";
  cityId: string;
  propertyType: "apartment" | "villa" | "land" | "shop" | "building" | "mall";
  assignedUserId?: string | null;
  phoneNumber: string;
  description: string;
  createdById: string;
  createdAt: DbDate;
  updatedAt: DbDate;
};

export type InvitationRecord = {
  tokenHash: string;
  userId: string;
  expiresAt: DbDate;
  acceptedAt?: DbDate | null;
  createdById?: string | null;
  createdAt: DbDate;
};

export type WithId<T> = T & { id: string };

export function fromDoc<T>(doc: DocumentSnapshot<T> | QueryDocumentSnapshot<T>) {
  if (!doc.exists) {
    return null;
  }

  return { id: doc.id, ...(doc.data() as T) };
}

export function requireDoc<T>(doc: DocumentSnapshot<T> | QueryDocumentSnapshot<T>, message = "Record not found") {
  const data = fromDoc(doc);
  if (!data) {
    throw new Error(message);
  }

  return data;
}

export function toDate(value: DbDate | undefined | null) {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value : value.toDate();
}

export function byDateDesc<T extends { updatedAt: DbDate }>(a: T, b: T) {
  return toDate(b.updatedAt)!.getTime() - toDate(a.updatedAt)!.getTime();
}
