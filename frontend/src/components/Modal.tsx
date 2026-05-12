import { X } from "lucide-react";
import { cn } from "../lib/cn";

type ModalProps = {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  className?: string;
};

export function Modal({ open, title, children, onClose, className }: ModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <section className={cn("surface max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-lg", className)} role="dialog" aria-modal="true">
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-extrabold text-slate-950">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="max-h-[calc(92vh-72px)] overflow-y-auto p-5">{children}</div>
      </section>
    </div>
  );
}
