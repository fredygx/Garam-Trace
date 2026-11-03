"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
} from "lucide-react";
import type { ToastMessage, ToastType } from "@/lib/types";
import { cn } from "@/lib/utils";

const toastStyle: Record<
  ToastType,
  { wrapper: string; icon: string; Icon: typeof CheckCircle2 }
> = {
  success: {
    wrapper: "border-emerald-200 bg-white",
    icon: "bg-emerald-100 text-emerald-700",
    Icon: CheckCircle2,
  },
  error: {
    wrapper: "border-rose-200 bg-white",
    icon: "bg-rose-100 text-rose-700",
    Icon: AlertTriangle,
  },
  info: {
    wrapper: "border-sky-200 bg-white",
    icon: "bg-sky-100 text-sky-700",
    Icon: Info,
  },
};

export function ToastStack({
  toasts,
  onDismiss,
}: {
  toasts: ToastMessage[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div
      aria-live="polite"
      className="no-print pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:left-auto sm:right-6 sm:items-end sm:px-0"
    >
      {toasts.map((toast) => {
        const style = toastStyle[toast.type];
        const Icon = style.Icon;
        return (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border p-4 shadow-xl shadow-slate-900/10 animate-fade-up",
              style.wrapper,
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
                style.icon,
              )}
            >
              <Icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900">
                {toast.title}
              </p>
              {toast.description ? (
                <p className="mt-0.5 text-xs leading-5 text-slate-500">
                  {toast.description}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Tutup notifikasi"
            >
              <X className="size-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
