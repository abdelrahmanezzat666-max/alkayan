import type { OperationType, PermissionName, PropertyType } from "../api/types";

export const OPERATION_LABELS: Record<OperationType, string> = {
  sale: "بيع",
  rent: "إيجار"
};

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  apartment: "شقق",
  villa: "فيلات",
  land: "أراضي",
  shop: "محلات",
  building: "عمارات",
  mall: "مولات"
};

export const PROPERTY_TYPE_OPTIONS: Array<{ value: PropertyType; label: string }> = [
  { value: "apartment", label: "شقة" },
  { value: "villa", label: "فيلا" },
  { value: "land", label: "أرض" },
  { value: "shop", label: "محل" },
  { value: "building", label: "عمارة" },
  { value: "mall", label: "مول" }
];

export const PERMISSION_LABELS: Record<PermissionName, string> = {
  view_properties: "عرض العقارات",
  add_property: "إضافة عقار",
  edit_property: "تعديل عقار",
  delete_property: "حذف عقار",
  view_phone_numbers: "عرض أرقام الهاتف",
  manage_users: "إدارة المستخدمين",
  manage_permissions: "إدارة الصلاحيات",
  manage_cities: "إدارة المدن",
  admin_access: "وصول المدير"
};
