import type { Assignee, City, ManagedUser, PermissionName, Property, PropertyPayload, Role, UserContext } from "./types";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? "/api" : "http://localhost:4000/api");
export const TOKEN_KEY = "alkayan_token";

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

type RequestOptions = RequestInit & {
  skipAuth?: boolean;
};

export async function apiFetch<T>(path: string, options: RequestOptions = {}) {
  const headers = new Headers(options.headers);
  const token = localStorage.getItem(TOKEN_KEY);

  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token && !options.skipAuth) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new ApiError(data?.message ?? "Request failed", response.status, data);
  }

  return data as T;
}

export const api = {
  login: (email: string, password: string) =>
    apiFetch<{ token: string; user: UserContext }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      skipAuth: true
    }),
  acceptInvitation: (token: string, password: string) =>
    apiFetch<{ token: string; user: UserContext }>("/auth/accept-invitation", {
      method: "POST",
      body: JSON.stringify({ token, password }),
      skipAuth: true
    }),
  me: () => apiFetch<{ user: UserContext }>("/auth/me"),
  cities: () => apiFetch<{ cities: City[] }>("/cities"),
  assignees: () => apiFetch<{ users: Assignee[] }>("/users/assignees"),
  users: () => apiFetch<{ users: ManagedUser[] }>("/users"),
  createUser: (payload: { name: string; email: string; permissionNames: PermissionName[] }) =>
    apiFetch<{ user: ManagedUser; devInvitationUrl?: string }>("/users", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  deleteUser: (id: string) => apiFetch<void>(`/users/${id}`, { method: "DELETE" }),
  resendInvitation: (id: string) => apiFetch<{ message: string; devInvitationUrl?: string }>(`/users/${id}/invite`, { method: "POST" }),
  permissions: () => apiFetch<{ permissions: Array<{ id: string; name: PermissionName }>; roles: Role[] }>("/permissions"),
  updateRole: (id: string, permissionNames: PermissionName[]) =>
    apiFetch<{ role: Role }>(`/permissions/roles/${id}`, {
      method: "PUT",
      body: JSON.stringify({ permissionNames })
    }),
  createCity: (name: string) => apiFetch<{ city: City }>("/cities", { method: "POST", body: JSON.stringify({ name }) }),
  updateCity: (id: string, name: string) => apiFetch<{ city: City }>(`/cities/${id}`, { method: "PUT", body: JSON.stringify({ name }) }),
  deleteCity: (id: string) => apiFetch<void>(`/cities/${id}`, { method: "DELETE" }),
  properties: (params: URLSearchParams) => apiFetch<{ properties: Property[] }>(`/properties?${params.toString()}`),
  checkPhone: (phoneNumber: string, excludeId?: string) => {
    const params = new URLSearchParams({ phoneNumber });
    if (excludeId) {
      params.set("excludeId", excludeId);
    }
    return apiFetch<{ exists: boolean; property: Property | null }>(`/properties/phone-check?${params.toString()}`);
  },
  createProperty: (payload: PropertyPayload) =>
    apiFetch<{ property: Property }>("/properties", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  updateProperty: (id: string, payload: Partial<PropertyPayload>) =>
    apiFetch<{ property: Property }>(`/properties/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    }),
  deleteProperty: (id: string) => apiFetch<void>(`/properties/${id}`, { method: "DELETE" })
};
