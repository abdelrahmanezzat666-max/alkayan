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
];
export const PROPERTY_TYPES = ["apartment", "villa", "land", "shop", "building", "mall"];
export const OPERATION_TYPES = ["sale", "rent"];
export function hasPermission(userPermissions, permission) {
    return userPermissions.includes("admin_access") || userPermissions.includes(permission);
}
