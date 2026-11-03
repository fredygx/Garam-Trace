import {
  Building2,
  Home,
  Truck,
  UserRound,
} from "lucide-react";
import type { ComponentType } from "react";
import { LABEL_TAHAP } from "@/lib/constants";
import type { RiwayatDistribusi, TahapDistribusi } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

const tahapMeta: Record<
  TahapDistribusi,
  { icon: ComponentType<{ className?: string }>; color: string }
> = {
  tambak: {
    icon: Home,
    color: "bg-teal-50 text-teal-700 ring-teal-600/10",
  },
  gudang_koperasi: {
    icon: Building2,
    color: "bg-sky-50 text-sky-700 ring-sky-600/10",
  },
  distributor: {
    icon: Truck,
    color: "bg-amber-50 text-amber-700 ring-amber-600/10",
  },
  konsumen: {
    icon: UserRound,
    color: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
  },
};

export function TimelineDistribusi({
  riwayat,
}: {
  riwayat: RiwayatDistribusi[];
}) {
  if (riwayat.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center text-sm text-slate-500">
        Riwayat distribusi belum dicatat. Catatan distribusi ditambahkan
        bertahap oleh kustodian barang.
      </div>
    );
  }

  return (
    <ol className="relative space-y-0">
      {riwayat.map((item, index) => {
        const meta = tahapMeta[item.tahap];
        const Icon = meta.icon;
        const isLast = index === riwayat.length - 1;
        return (
          <li key={`${item.tahap}-${item.waktu}`} className="relative flex gap-4">
            <div className="flex flex-col items-center">
              <span
                className={`flex size-10 shrink-0 items-center justify-center rounded-full ring-1 ring-inset ${meta.color}`}
              >
                <Icon className="size-4" />
              </span>
              {!isLast ? (
                <span className="my-1 w-px flex-1 bg-slate-200" />
              ) : null}
            </div>
            <div className={isLast ? "pb-0" : "pb-6"}>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <p className="text-sm font-semibold text-slate-900">
                  {LABEL_TAHAP[item.tahap]}
                </p>
                <span className="text-[11px] text-slate-400">
                  {formatDateTime(item.waktu)}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-slate-600">{item.lokasi}</p>
              <p className="mt-0.5 text-xs text-slate-400">{item.aktor}</p>
              {item.catatan ? (
                <p className="mt-1 max-w-xl text-xs leading-5 text-slate-500">
                  {item.catatan}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
