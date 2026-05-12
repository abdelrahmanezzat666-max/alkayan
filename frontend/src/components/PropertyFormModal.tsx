import { AlertTriangle, Save } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ApiError, api } from "../api/client";
import type { Assignee, City, OperationType, Property, PropertyPayload, PropertyType } from "../api/types";
import { OPERATION_LABELS, PROPERTY_TYPE_OPTIONS } from "../lib/labels";
import { Button } from "./Button";
import { Modal } from "./Modal";
import { useToast } from "../context/ToastContext";

type PropertyFormModalProps = {
  open: boolean;
  mode: "create" | "edit";
  property?: Property | null;
  cities: City[];
  assignees: Assignee[];
  defaultOperation: OperationType;
  defaultCityId?: string;
  onClose: () => void;
  onSaved: () => void;
};

const emptyForm = {
  operationType: "sale" as OperationType,
  cityId: "",
  propertyType: "apartment" as PropertyType,
  assignedUserId: "",
  phoneNumber: "",
  description: ""
};

export function PropertyFormModal({
  open,
  mode,
  property,
  cities,
  assignees,
  defaultOperation,
  defaultCityId,
  onClose,
  onSaved
}: PropertyFormModalProps) {
  const { showToast } = useToast();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [duplicate, setDuplicate] = useState<Property | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (mode === "edit" && property) {
      setForm({
        operationType: property.operationType,
        cityId: property.cityId,
        propertyType: property.propertyType,
        assignedUserId: property.assignedUserId ?? "",
        phoneNumber: property.canViewFullPhoneNumber ? property.phoneNumber : "",
        description: property.description
      });
    } else {
      setForm({
        ...emptyForm,
        operationType: defaultOperation,
        cityId: defaultCityId ?? cities[0]?.id ?? ""
      });
    }

    setDuplicate(null);
  }, [cities, defaultCityId, defaultOperation, mode, open, property]);

  const title = mode === "create" ? "إضافة عقار" : "تعديل عقار";
  const canSubmit = useMemo(() => !saving && !checking && !duplicate, [checking, duplicate, saving]);

  async function checkPhone() {
    const phone = form.phoneNumber.trim();
    if (!phone) {
      setDuplicate(null);
      return;
    }

    setChecking(true);
    try {
      const result = await api.checkPhone(phone, mode === "edit" ? property?.id : undefined);
      setDuplicate(result.property);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "تعذر فحص رقم الهاتف", "error");
    } finally {
      setChecking(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    if (mode === "create" && !form.phoneNumber.trim()) {
      showToast("رقم الهاتف مطلوب", "error");
      return;
    }

    setSaving(true);
    try {
      const payload: Partial<PropertyPayload> = {
        operationType: form.operationType,
        cityId: form.cityId,
        propertyType: form.propertyType,
        assignedUserId: form.assignedUserId || null,
        description: form.description
      };

      if (form.phoneNumber.trim()) {
        payload.phoneNumber = form.phoneNumber.trim();
      }

      if (mode === "edit" && property) {
        await api.updateProperty(property.id, payload);
      } else {
        await api.createProperty(payload as PropertyPayload);
      }

      showToast(mode === "create" ? "تم حفظ العقار" : "تم تحديث العقار", "success");
      onSaved();
      onClose();
    } catch (error) {
      if (error instanceof ApiError && typeof error.data === "object" && error.data && "details" in error.data) {
        const details = (error.data as { details?: { property?: Property } }).details;
        if (details?.property) {
          setDuplicate(details.property);
        }
      }
      showToast(error instanceof Error ? error.message : "تعذر حفظ العقار", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} title={title} onClose={onClose}>
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <label>
            <span className="label">نوع العملية</span>
            <select className="field" value={form.operationType} onChange={(event) => setForm((current) => ({ ...current, operationType: event.target.value as OperationType }))}>
              <option value="sale">{OPERATION_LABELS.sale}</option>
              <option value="rent">{OPERATION_LABELS.rent}</option>
            </select>
          </label>

          <label>
            <span className="label">المدينة</span>
            <select className="field" value={form.cityId} onChange={(event) => setForm((current) => ({ ...current, cityId: event.target.value }))} required>
              <option value="">اختر مدينة</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="label">نوع العقار</span>
            <select className="field" value={form.propertyType} onChange={(event) => setForm((current) => ({ ...current, propertyType: event.target.value as PropertyType }))}>
              {PROPERTY_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="label">الموظف المسؤول</span>
            <select className="field" value={form.assignedUserId} onChange={(event) => setForm((current) => ({ ...current, assignedUserId: event.target.value }))}>
              <option value="">غير محدد</option>
              {assignees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label>
          <span className="label">رقم الهاتف</span>
          <input
            className="field"
            type="tel"
            value={form.phoneNumber}
            placeholder={mode === "edit" && property && !property.canViewFullPhoneNumber ? property.phoneNumberMasked : "01012345678"}
            onChange={(event) => {
              setDuplicate(null);
              setForm((current) => ({ ...current, phoneNumber: event.target.value }));
            }}
            onBlur={checkPhone}
            required={mode === "create"}
          />
        </label>

        {duplicate ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
            <div className="mb-2 flex items-center gap-2 font-extrabold">
              <AlertTriangle className="h-5 w-5" />
              رقم الهاتف موجود بالفعل
            </div>
            <p>العقار الحالي: {duplicate.city.name} - {duplicate.description}</p>
            <p dir="ltr" className="mt-1 font-bold">
              {duplicate.phoneNumber}
            </p>
          </div>
        ) : null}

        <label>
          <span className="label">الوصف</span>
          <textarea
            className="field min-h-32 resize-y"
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            required
          />
        </label>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="submit" loading={saving || checking} disabled={!canSubmit}>
            <Save className="h-4 w-4" />
            حفظ
          </Button>
        </div>
      </form>
    </Modal>
  );
}
