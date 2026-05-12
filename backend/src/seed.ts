import bcrypt from "bcryptjs";
import { db, FieldValue } from "./config/firebase.js";
import { ALL_PERMISSIONS } from "./lib/permissions.js";

const cityNames = ["El Shorouk", "Badr", "Obour", "Madinaty"];

async function upsertByName(collection: string, name: string, data: Record<string, unknown>) {
  const snapshot = await db.collection(collection).where("name", "==", name).limit(1).get();
  const ref = snapshot.docs[0]?.ref ?? db.collection(collection).doc();
  await ref.set(
    {
      name,
      ...data,
      createdAt: snapshot.docs[0]?.data().createdAt ?? FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    },
    { merge: true }
  );
  return ref;
}

async function main() {
  for (const name of ALL_PERMISSIONS) {
    await db.collection("permissions").doc(name).set({ name }, { merge: true });
  }

  const adminRole = await upsertByName("roles", "admin", {
    permissionNames: ALL_PERMISSIONS
  });

  await upsertByName("roles", "employee", {
    permissionNames: ["view_properties", "add_property", "edit_property"]
  });

  for (const name of cityNames) {
    await upsertByName("cities", name, {});
  }

  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@alkayan.local";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "ChangeMe123!";
  const adminName = process.env.ADMIN_NAME ?? "Al Kayan Admin";
  const password = await bcrypt.hash(adminPassword, 12);
  const existingAdmin = await db.collection("users").where("email", "==", adminEmail).limit(1).get();
  const adminRef = existingAdmin.docs[0]?.ref ?? db.collection("users").doc();

  await adminRef.set(
    {
      name: adminName,
      email: adminEmail,
      password,
      roleIds: [adminRole.id],
      createdAt: existingAdmin.docs[0]?.data().createdAt ?? FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    },
    { merge: true }
  );

  console.log(`Firebase seed complete. Admin: ${adminEmail}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
