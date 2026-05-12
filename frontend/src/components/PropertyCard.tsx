import { CalendarDays, MapPin, Pencil, Phone, Trash2, UserRound } from "lucide-react";
import type { Property } from "../api/types";
import { PROPERTY_TYPE_LABELS } from "../lib/labels";
import { Button } from "./Button";

type PropertyCardProps = {
  property: Property;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (property: Property) => void;
  onDelete: (property: Property) => void;
};

export function PropertyCard({ property, canEdit, canDelete, onEdit, onDelete }: PropertyCardProps) {
  return (
    <article className="surface rounded-lg p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-900">
            {PROPERTY_TYPE_LABELS[property.propertyType]}
          </span>
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-700">{property.description}</p>
        </div>
        <div className="flex gap-2">
          {canEdit ? (
            <button type="button" onClick={() => onEdit(property)} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50" aria-label="Edit property">
              <Pencil className="h-4 w-4" />
            </button>
          ) : null}
          {canDelete ? (
            <button type="button" onClick={() => onDelete(property)} className="rounded-lg border border-rose-200 p-2 text-rose-600 hover:bg-rose-50" aria-label="Delete property">
              <Trash2 className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      <dl className="grid gap-2 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-teal-700" />
          <dt className="sr-only">City</dt>
          <dd>{property.city.name}</dd>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-teal-700" />
          <dt className="sr-only">Phone</dt>
          <dd dir="ltr" className="font-semibold text-slate-900">
            {property.phoneNumber}
          </dd>
        </div>
        <div className="flex items-center gap-2">
          <UserRound className="h-4 w-4 text-teal-700" />
          <dt className="sr-only">Assigned employee</dt>
          <dd>{property.assignedEmployee?.name ?? "غير محدد"}</dd>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <CalendarDays className="h-4 w-4" />
          <dt className="sr-only">Updated</dt>
          <dd>{new Date(property.updatedAt).toLocaleDateString("ar-EG")}</dd>
        </div>
      </dl>

      {!canEdit && !canDelete ? (
        <div className="mt-4">
          <Button type="button" variant="secondary" className="w-full" disabled>
            عرض فقط
          </Button>
        </div>
      ) : null}
    </article>
  );
}
