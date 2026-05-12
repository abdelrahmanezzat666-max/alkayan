import { Building2, ChevronRight, Loader2, MapPin, Plus, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import type { Assignee, City, OperationType, Property, PropertyType } from "../api/types";
import { Button } from "../components/Button";
import { Modal } from "../components/Modal";
import { PropertyCard } from "../components/PropertyCard";
import { PropertyFormModal } from "../components/PropertyFormModal";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { OPERATION_LABELS, PROPERTY_TYPE_LABELS } from "../lib/labels";
import { cn } from "../lib/cn";

const propertyOrder: PropertyType[] = ["apartment", "villa", "land", "shop", "building", "mall"];

export function DashboardPage() {
  const { hasPermission } = useAuth();
  const { showToast } = useToast();
  const [operation, setOperation] = useState<OperationType>("sale");
  const [cities, setCities] = useState<City[]>([]);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [propertiesLoading, setPropertiesLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Property | null>(null);
  const [deleting, setDeleting] = useState(false);

  const canAdd = hasPermission("add_property");
  const canEdit = hasPermission("edit_property");
  const canDelete = hasPermission("delete_property");

  const loadLookups = useCallback(async () => {
    setLoading(true);
    try {
      const [cityResult, assigneeResult] = await Promise.all([api.cities(), api.assignees()]);
      setCities(cityResult.cities);
      setAssignees(assigneeResult.users);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "تعذر تحميل البيانات", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const loadProperties = useCallback(async () => {
    if (!selectedCity) {
      setProperties([]);
      return;
    }

    setPropertiesLoading(true);
    try {
      const params = new URLSearchParams({
        operationType: operation,
        cityId: selectedCity.id
      });
      if (search.trim()) {
        params.set("search", search.trim());
      }
      const result = await api.properties(params);
      setProperties(result.properties);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "تعذر تحميل العقارات", "error");
    } finally {
      setPropertiesLoading(false);
    }
  }, [operation, search, selectedCity, showToast]);

  useEffect(() => {
    void loadLookups();
  }, [loadLookups]);

  useEffect(() => {
    void loadProperties();
  }, [loadProperties]);

  const grouped = useMemo(() => {
    const map = new Map<PropertyType, Property[]>();
    for (const type of propertyOrder) {
      map.set(type, []);
    }
    for (const property of properties) {
      map.get(property.propertyType)?.push(property);
    }
    return map;
  }, [properties]);

  function openCreate() {
    setEditingProperty(null);
    setFormOpen(true);
  }

  function openEdit(property: Property) {
    setEditingProperty(property);
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!deleteTarget) {
      return;
    }
    setDeleting(true);
    try {
      await api.deleteProperty(deleteTarget.id);
      showToast("تم حذف العقار", "success");
      setDeleteTarget(null);
      await loadProperties();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "تعذر حذف العقار", "error");
    } finally {
      setDeleting(false);
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
      <header className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-sm font-bold text-teal-700">Al Kayan</p>
          <h1 className="text-3xl font-extrabold text-slate-950">لوحة العقارات</h1>
        </div>
        {canAdd ? (
          <Button type="button" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            إضافة عقار
          </Button>
        ) : null}
      </header>

      <section className="surface mb-6 rounded-lg p-2">
        <div className="grid grid-cols-2 gap-2">
          {(["sale", "rent"] as OperationType[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setOperation(item);
                setSelectedCity(null);
              }}
              className={cn(
                "rounded-lg px-4 py-3 text-sm font-extrabold transition",
                operation === item ? "bg-teal-700 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"
              )}
            >
              {OPERATION_LABELS[item]}
            </button>
          ))}
        </div>
      </section>

      {!selectedCity ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cities.map((city) => (
            <button
              key={city.id}
              type="button"
              onClick={() => setSelectedCity(city)}
              className="surface group rounded-lg p-5 text-right transition hover:-translate-y-0.5 hover:border-teal-300"
            >
              <div className="mb-6 flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-teal-50 text-teal-800">
                  <MapPin className="h-6 w-6" />
                </div>
                <ChevronRight className="h-5 w-5 rotate-180 text-slate-400 transition group-hover:text-teal-700" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-950">{city.name}</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">{city._count?.properties ?? 0} عقار</p>
            </button>
          ))}
        </section>
      ) : (
        <section>
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <button type="button" onClick={() => setSelectedCity(null)} className="inline-flex items-center gap-2 text-sm font-bold text-teal-800">
              <ChevronRight className="h-4 w-4" />
              المدن
            </button>
            <div className="relative w-full lg:max-w-md">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input className="field pr-10" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="بحث بالوصف أو المدينة" />
            </div>
          </div>

          <div className="mb-6 flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4">
            <Building2 className="h-6 w-6 text-teal-700" />
            <div>
              <h2 className="text-xl font-extrabold text-slate-950">
                {OPERATION_LABELS[operation]} - {selectedCity.name}
              </h2>
              <p className="text-sm font-semibold text-slate-500">{properties.length} نتيجة</p>
            </div>
          </div>

          {propertiesLoading ? (
            <div className="flex min-h-56 items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-teal-700" />
            </div>
          ) : (
            <div className="grid gap-6">
              {propertyOrder.map((type) => {
                const items = grouped.get(type) ?? [];
                return (
                  <section key={type} className="grid gap-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-extrabold text-slate-950">{PROPERTY_TYPE_LABELS[type]}</h3>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{items.length}</span>
                    </div>
                    {items.length > 0 ? (
                      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                        {items.map((property) => (
                          <PropertyCard key={property.id} property={property} canEdit={canEdit} canDelete={canDelete} onEdit={openEdit} onDelete={setDeleteTarget} />
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed border-slate-300 bg-white/70 p-6 text-center text-sm font-semibold text-slate-500">لا توجد نتائج</div>
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </section>
      )}

      <PropertyFormModal
        open={formOpen}
        mode={editingProperty ? "edit" : "create"}
        property={editingProperty}
        cities={cities}
        assignees={assignees}
        defaultOperation={operation}
        defaultCityId={selectedCity?.id}
        onClose={() => setFormOpen(false)}
        onSaved={loadProperties}
      />

      <Modal open={Boolean(deleteTarget)} title="تأكيد الحذف" onClose={() => setDeleteTarget(null)} className="max-w-md">
        <p className="text-sm leading-6 text-slate-700">سيتم حذف هذا العقار نهائيا من النظام.</p>
        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={() => setDeleteTarget(null)}>
            إلغاء
          </Button>
          <Button type="button" variant="danger" loading={deleting} onClick={confirmDelete}>
            حذف
          </Button>
        </div>
      </Modal>
    </div>
  );
}
