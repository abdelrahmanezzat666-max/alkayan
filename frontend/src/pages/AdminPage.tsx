import { Building2, Check, Loader2, Mail, MapPin, Plus, RefreshCw, ShieldCheck, Trash2, Users } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import type { City, ManagedUser, PermissionName, Property, Role } from "../api/types";
import { Button } from "../components/Button";
import { Modal } from "../components/Modal";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { cn } from "../lib/cn";
import { OPERATION_LABELS, PERMISSION_LABELS, PROPERTY_TYPE_LABELS } from "../lib/labels";

type TabKey = "users" | "permissions" | "cities" | "properties";

const tabs: Array<{ key: TabKey; label: string; icon: typeof Users }> = [
  { key: "users", label: "المستخدمون", icon: Users },
  { key: "permissions", label: "الصلاحيات", icon: ShieldCheck },
  { key: "cities", label: "المدن", icon: MapPin },
  { key: "properties", label: "العقارات", icon: Building2 }
];

export function AdminPage() {
  const { hasPermission } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabKey>("users");
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<PermissionName[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [deletePropertyId, setDeletePropertyId] = useState<string | null>(null);

  const canManageUsers = hasPermission("manage_users");
  const canManagePermissions = hasPermission("manage_permissions");
  const canManageCities = hasPermission("manage_cities");
  const canDeleteProperties = hasPermission("delete_property");

  const loadAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const tasks: Array<Promise<unknown>> = [];
      if (canManageUsers) {
        tasks.push(api.users().then((result) => setUsers(result.users)));
      }
      if (canManagePermissions) {
        tasks.push(
          api.permissions().then((result) => {
            setPermissions(result.permissions.map((permission) => permission.name));
            setRoles(result.roles);
          })
        );
      }
      if (canManageCities) {
        tasks.push(api.cities().then((result) => setCities(result.cities)));
      }
      tasks.push(api.properties(new URLSearchParams()).then((result) => setProperties(result.properties)));
      await Promise.all(tasks);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "تعذر تحميل الإدارة", "error");
    } finally {
      setLoading(false);
    }
  }, [canManageCities, canManagePermissions, canManageUsers, showToast]);

  useEffect(() => {
    void loadAdminData();
  }, [loadAdminData]);

  const availableTabs = useMemo(
    () =>
      tabs.filter((tab) => {
        if (tab.key === "users") return canManageUsers;
        if (tab.key === "permissions") return canManagePermissions;
        if (tab.key === "cities") return canManageCities;
        return true;
      }),
    [canManageCities, canManagePermissions, canManageUsers]
  );

  async function deleteUser() {
    if (!deleteUserId) return;
    try {
      await api.deleteUser(deleteUserId);
      showToast("تم حذف المستخدم", "success");
      setDeleteUserId(null);
      await loadAdminData();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "تعذر حذف المستخدم", "error");
    }
  }

  async function deleteProperty() {
    if (!deletePropertyId) return;
    try {
      await api.deleteProperty(deletePropertyId);
      showToast("تم حذف العقار", "success");
      setDeletePropertyId(null);
      await loadAdminData();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "تعذر حذف العقار", "error");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-700" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      <header className="mb-6">
        <p className="text-sm font-bold text-teal-700">Admin</p>
        <h1 className="text-3xl font-extrabold text-slate-950">لوحة الإدارة</h1>
      </header>

      <div className="surface mb-6 grid gap-2 rounded-lg p-2 md:grid-cols-4">
        {availableTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-extrabold transition",
                activeTab === tab.key ? "bg-teal-700 text-white" : "text-slate-600 hover:bg-slate-50"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "users" && canManageUsers ? <UsersPanel users={users} permissions={permissions} onRefresh={loadAdminData} onDelete={setDeleteUserId} /> : null}
      {activeTab === "permissions" && canManagePermissions ? <PermissionsPanel roles={roles} permissions={permissions} onRefresh={loadAdminData} /> : null}
      {activeTab === "cities" && canManageCities ? <CitiesPanel cities={cities} onRefresh={loadAdminData} /> : null}
      {activeTab === "properties" ? <PropertiesPanel properties={properties} canDelete={canDeleteProperties} onDelete={setDeletePropertyId} /> : null}

      <Modal open={Boolean(deleteUserId)} title="حذف المستخدم" onClose={() => setDeleteUserId(null)} className="max-w-md">
        <p className="text-sm text-slate-700">سيتم حذف المستخدم إذا لم يكن مرتبطا بسجلات تمنع الحذف.</p>
        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={() => setDeleteUserId(null)}>
            إلغاء
          </Button>
          <Button type="button" variant="danger" onClick={deleteUser}>
            حذف
          </Button>
        </div>
      </Modal>

      <Modal open={Boolean(deletePropertyId)} title="حذف العقار" onClose={() => setDeletePropertyId(null)} className="max-w-md">
        <p className="text-sm text-slate-700">سيتم حذف العقار نهائيا.</p>
        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={() => setDeletePropertyId(null)}>
            إلغاء
          </Button>
          <Button type="button" variant="danger" onClick={deleteProperty}>
            حذف
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function UsersPanel({
  users,
  permissions,
  onRefresh,
  onDelete
}: {
  users: ManagedUser[];
  permissions: PermissionName[];
  onRefresh: () => Promise<void>;
  onDelete: (id: string) => void;
}) {
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<PermissionName[]>(["view_properties"]);
  const [creating, setCreating] = useState(false);
  const [devLink, setDevLink] = useState("");

  function togglePermission(permission: PermissionName) {
    setSelectedPermissions((current) => (current.includes(permission) ? current.filter((item) => item !== permission) : [...current, permission]));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setCreating(true);
    try {
      const result = await api.createUser({ name, email, permissionNames: selectedPermissions });
      setName("");
      setEmail("");
      setSelectedPermissions(["view_properties"]);
      setDevLink(result.devInvitationUrl ?? "");
      showToast("تم إرسال الدعوة", "success");
      await onRefresh();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "تعذر إنشاء المستخدم", "error");
    } finally {
      setCreating(false);
    }
  }

  async function resend(id: string) {
    try {
      const result = await api.resendInvitation(id);
      setDevLink(result.devInvitationUrl ?? "");
      showToast("تمت إعادة إرسال الدعوة", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "تعذر إرسال الدعوة", "error");
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <form className="surface rounded-lg p-5" onSubmit={submit}>
        <h2 className="mb-4 text-xl font-extrabold text-slate-950">إضافة مستخدم</h2>
        <div className="grid gap-4">
          <label>
            <span className="label">الاسم</span>
            <input className="field" value={name} onChange={(event) => setName(event.target.value)} required />
          </label>
          <label>
            <span className="label">البريد الإلكتروني</span>
            <input className="field" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <fieldset>
            <legend className="label">الصلاحيات</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {permissions.map((permission) => (
                <label key={permission} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2 text-sm font-semibold text-slate-700">
                  <input type="checkbox" checked={selectedPermissions.includes(permission)} onChange={() => togglePermission(permission)} />
                  {PERMISSION_LABELS[permission]}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
        <Button type="submit" className="mt-5 w-full" loading={creating}>
          <Plus className="h-4 w-4" />
          إنشاء وإرسال دعوة
        </Button>
        {devLink ? (
          <a className="mt-4 block break-all rounded-lg bg-slate-100 p-3 text-xs font-semibold text-teal-800" href={devLink} target="_blank" rel="noreferrer" dir="ltr">
            {devLink}
          </a>
        ) : null}
      </form>

      <section className="surface overflow-hidden rounded-lg">
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-xl font-extrabold text-slate-950">المستخدمون</h2>
        </div>
        <div className="divide-y divide-slate-200">
          {users.map((user) => (
            <article key={user.id} className="grid gap-3 p-4 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-extrabold text-slate-950">{user.name}</h3>
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", user.invitationAccepted ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900")}>
                    {user.invitationAccepted ? "مفعل" : "بانتظار الدعوة"}
                  </span>
                </div>
                <p className="text-sm text-slate-500" dir="ltr">
                  {user.email}
                </p>
                <p className="mt-2 text-xs font-semibold text-slate-500">{user.permissions.map((permission) => PERMISSION_LABELS[permission]).join("، ")}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {!user.invitationAccepted ? (
                  <Button type="button" variant="secondary" onClick={() => resend(user.id)}>
                    <Mail className="h-4 w-4" />
                    دعوة
                  </Button>
                ) : null}
                <Button type="button" variant="danger" onClick={() => onDelete(user.id)}>
                  <Trash2 className="h-4 w-4" />
                  حذف
                </Button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function PermissionsPanel({ roles, permissions, onRefresh }: { roles: Role[]; permissions: PermissionName[]; onRefresh: () => Promise<void> }) {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      {roles.map((role) => (
        <RoleEditor key={role.id} role={role} permissions={permissions} onRefresh={onRefresh} />
      ))}
    </section>
  );
}

function RoleEditor({ role, permissions, onRefresh }: { role: Role; permissions: PermissionName[]; onRefresh: () => Promise<void> }) {
  const { showToast } = useToast();
  const [selected, setSelected] = useState<PermissionName[]>(role.permissions);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSelected(role.permissions);
  }, [role.permissions]);

  function toggle(permission: PermissionName) {
    setSelected((current) => (current.includes(permission) ? current.filter((item) => item !== permission) : [...current, permission]));
  }

  async function save() {
    setSaving(true);
    try {
      await api.updateRole(role.id, selected);
      showToast("تم حفظ الصلاحيات", "success");
      await onRefresh();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "تعذر حفظ الصلاحيات", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="surface rounded-lg p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold text-slate-950">{role.name}</h2>
        <Button type="button" variant="secondary" loading={saving} onClick={save}>
          <Check className="h-4 w-4" />
          حفظ
        </Button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {permissions.map((permission) => (
          <label key={permission} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2 text-sm font-semibold text-slate-700">
            <input type="checkbox" checked={selected.includes(permission)} onChange={() => toggle(permission)} />
            {PERMISSION_LABELS[permission]}
          </label>
        ))}
      </div>
    </article>
  );
}

function CitiesPanel({ cities, onRefresh }: { cities: City[]; onRefresh: () => Promise<void> }) {
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await api.createCity(name);
      setName("");
      showToast("تمت إضافة المدينة", "success");
      await onRefresh();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "تعذر إضافة المدينة", "error");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    try {
      await api.deleteCity(id);
      showToast("تم حذف المدينة", "success");
      await onRefresh();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "تعذر حذف المدينة", "error");
    }
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
      <form className="surface rounded-lg p-5" onSubmit={submit}>
        <h2 className="mb-4 text-xl font-extrabold text-slate-950">إضافة مدينة</h2>
        <label>
          <span className="label">اسم المدينة</span>
          <input className="field" value={name} onChange={(event) => setName(event.target.value)} required />
        </label>
        <Button type="submit" className="mt-5 w-full" loading={saving}>
          <Plus className="h-4 w-4" />
          إضافة
        </Button>
      </form>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cities.map((city) => (
          <article key={city.id} className="surface rounded-lg p-4">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-slate-950">{city.name}</h3>
                <p className="text-sm font-semibold text-slate-500">{city._count?.properties ?? 0} عقار</p>
              </div>
              <Button type="button" variant="danger" onClick={() => remove(city.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function PropertiesPanel({ properties, canDelete, onDelete }: { properties: Property[]; canDelete: boolean; onDelete: (id: string) => void }) {
  return (
    <section className="surface overflow-hidden rounded-lg">
      <div className="flex items-center justify-between border-b border-slate-200 p-5">
        <h2 className="text-xl font-extrabold text-slate-950">إدارة العقارات</h2>
        <RefreshCw className="h-5 w-5 text-slate-400" />
      </div>
      <div className="divide-y divide-slate-200">
        {properties.map((property) => (
          <article key={property.id} className="grid gap-3 p-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-bold text-teal-800">{OPERATION_LABELS[property.operationType]}</span>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-900">{PROPERTY_TYPE_LABELS[property.propertyType]}</span>
                <h3 className="font-extrabold text-slate-950">{property.city.name}</h3>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-slate-600">{property.description}</p>
              <p className="mt-1 text-sm font-bold text-slate-900" dir="ltr">
                {property.phoneNumber}
              </p>
            </div>
            {canDelete ? (
              <Button type="button" variant="danger" onClick={() => onDelete(property.id)}>
                <Trash2 className="h-4 w-4" />
                حذف
              </Button>
            ) : null}
          </article>
        ))}
        {properties.length === 0 ? <p className="p-6 text-center text-sm font-semibold text-slate-500">لا توجد عقارات</p> : null}
      </div>
    </section>
  );
}
