import { db, FieldValue } from "../../config/firebase.js";
import { fromDoc } from "../../lib/firestore.js";
import { HttpError } from "../../lib/http-error.js";
import { ALL_PERMISSIONS } from "../../lib/permissions.js";
function roleDto(role) {
    return {
        id: role.id,
        name: role.name,
        permissions: role.permissionNames ?? []
    };
}
function assertValidPermissions(permissionNames) {
    const allowed = new Set(ALL_PERMISSIONS);
    if (permissionNames.some((permission) => !allowed.has(permission))) {
        throw new HttpError(400, "One or more permissions are invalid");
    }
}
async function assertUniqueRoleName(name, excludeId) {
    const snapshot = await db.collection("roles").where("name", "==", name).limit(1).get();
    const existing = snapshot.docs[0] ? fromDoc(snapshot.docs[0]) : null;
    if (existing && existing.id !== excludeId) {
        throw new HttpError(409, "A role with this name already exists");
    }
}
export async function listPermissionsAndRoles() {
    const roleSnapshot = await db.collection("roles").orderBy("name", "asc").get();
    const roles = roleSnapshot.docs
        .map((doc) => fromDoc(doc))
        .filter((role) => Boolean(role));
    return {
        permissions: ALL_PERMISSIONS.map((name) => ({ id: name, name })),
        roles: roles.map(roleDto)
    };
}
export async function createRole(name, permissionNames) {
    assertValidPermissions(permissionNames);
    await assertUniqueRoleName(name);
    const ref = await db.collection("roles").add({
        name,
        permissionNames,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
    });
    const role = fromDoc((await ref.get()));
    return roleDto(role);
}
export async function updateRolePermissions(roleId, permissionNames) {
    assertValidPermissions(permissionNames);
    const ref = db.collection("roles").doc(roleId);
    const doc = await ref.get();
    if (!doc.exists) {
        throw new HttpError(404, "Role not found");
    }
    await ref.update({
        permissionNames,
        updatedAt: FieldValue.serverTimestamp()
    });
    return roleDto(fromDoc((await ref.get())));
}
export async function deleteRole(roleId) {
    const ref = db.collection("roles").doc(roleId);
    const role = fromDoc((await ref.get()));
    if (!role) {
        throw new HttpError(404, "Role not found");
    }
    if (["admin", "employee"].includes(role.name)) {
        throw new HttpError(400, "System roles cannot be deleted");
    }
    const users = await db.collection("users").where("roleIds", "array-contains", roleId).limit(1).get();
    if (!users.empty) {
        throw new HttpError(400, "Role cannot be deleted while assigned to users");
    }
    await ref.delete();
}
