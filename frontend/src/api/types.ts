export type PermissionName =
  | "view_properties"
  | "add_property"
  | "edit_property"
  | "delete_property"
  | "view_phone_numbers"
  | "manage_users"
  | "manage_permissions"
  | "manage_cities"
  | "admin_access";

export type OperationType = "sale" | "rent";
export type PropertyType = "apartment" | "villa" | "land" | "shop" | "building" | "mall";

export type UserContext = {
  id: string;
  name: string;
  email: string;
  permissions: PermissionName[];
  roles: string[];
};

export type Role = {
  id: string;
  name: string;
  permissions: PermissionName[];
};

export type ManagedUser = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  invitationAccepted: boolean;
  roles: Array<{ id: string; name: string }>;
  permissions: PermissionName[];
};

export type City = {
  id: string;
  name: string;
  _count?: {
    properties: number;
  };
};

export type Assignee = {
  id: string;
  name: string;
  email: string;
};

export type Property = {
  id: string;
  operationType: OperationType;
  cityId: string;
  city: City;
  propertyType: PropertyType;
  assignedUserId: string | null;
  assignedEmployee: Assignee | null;
  phoneNumber: string;
  phoneNumberMasked: string;
  canViewFullPhoneNumber: boolean;
  description: string;
  createdBy: Assignee;
  createdAt: string;
  updatedAt: string;
};

export type PropertyPayload = {
  operationType: OperationType;
  cityId: string;
  propertyType: PropertyType;
  assignedUserId?: string | null;
  phoneNumber?: string;
  description: string;
};
