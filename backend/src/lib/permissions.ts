export const ALL_PERMISSIONS = [
  "view_properties",
  "add_property",
  "edit_property",
  "delete_property",
  "view_phone_numbers",
  "manage_users",
  "manage_permissions",
  "manage_cities",
  "admin_access"
] as const;

export type PermissionName = (typeof ALL_PERMISSIONS)[number];

export const PROPERTY_TYPES = ["apartment", "villa", "land", "shop", "building", "mall"] as const;
export const OPERATION_TYPES = ["sale", "rent"] as const;

export function hasPermission(userPermissions: string[], permission: string) {
  return userPermissions.includes("admin_access") || userPermissions.includes(permission);
}
