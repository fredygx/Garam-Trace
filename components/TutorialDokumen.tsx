"use client";

import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BookOpen,
  CheckCircle2,
  FileText,
  Info,
  Sparkles,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

type StatusContoh = "Lolos" | "Tinjau";

const statusStyle: Record<
  StatusContoh,
  { badge: string; bar: string; icon: typeof CheckCircle2 }
> = {
  Lolos: {
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
    bar: "bg-emerald-500",
    icon: CheckCircle2,
  },
  Tinjau: {
    badge: "border-amber-200 bg-amber-50 text-amber-700",
    bar: "bg-amber-500",
    icon: AlertTriangle,
  },
};

const langkah = [
  {
    icon: FileText,
    title: "Siapkan surat asli",
    desc: "Siapkan surat kelompok tani atau dokumen izin/identitas garam sebagai referensi. Aplikasi hanya mencatat nomor dan nama kelompok, bukan mengunggah file surat.",
  },
  {
    icon: Users,
    title: "Samakan nama kelompok",
    desc: "Nama kelompok di form harus sama dengan nama yang tercantum di surat.",
  },
  {
    icon: Sparkles,
    title: "Cek hasilnya",
    desc: "Format lengkap membantu indikator dokumen. Status Tinjau berarti verifikator perlu mencocokkan manual.",
  },
];

const contohDokumen: {
  nomor: string;
  kelompok: string;
  skor: number;
  status: StatusContoh;
  catatan: string;
}[] = [
  {
    nomor: "IG-SALT-BALI/041/2026",
    kelompok: "Kelompok Petambak Amed",
    skor: 100,
    status: "Lolos",
    catatan: "Format lengkap: prefix, wilayah, nomor urut, dan tahun.",
  },
  {
    nomor: "SK/GT/2026/001",
    kelompok: "Kelompok Tani Segara",
    skor: 100,
    status: "Lolos",
    catatan: "Contoh format surat kelompok yang umum dan lengkap.",
  },
  {
    nomor: "017MDR",
    kelompok: "Kelompok Petambak Muncar",
    skor: 70,
    status: "Tinjau",
    catatan: "Tidak ada pemisah/format lengkap; verifikator cek manual.",
  },
];

const tips = [
  {
    icon: CheckCircle2,
    title: "Nomor harus sesuai surat",
    desc: "Jangan mengarang nomor; salin dari dokumen asli.",
  },
  {
    icon: Users,
    title: "Nama kelompok harus cocok",
    desc: "Verifikator mencocokkan dengan catatan kelompok/izin garam.",
  },
  {
    icon: AlertTriangle,
    title: "Tinjau bukan ditolak",
    desc: "Status ini meminta pemeriksaan manual, bukan penolakan.",
  },
];

export function TutorialDokumen({
  onUseExample,
}: {
  onUseExample: (nomor: string, kelompok: string) => void;
}) {
  return (
    <section id="tutorial-dokumen" className="mt-8 scroll-mt-24">
      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-r from-teal-50/80 via-white to-emerald-50/50 p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-teal-900 text-white shadow-lg shadow-teal-900/15">
                <BookOpen className="size-5" />
              </span>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-teal-600">
                  Tutorial · Dokumen Asal
                </p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
                  Cara mengisi nomor surat kelompok
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                  Nomor surat memengaruhi indikator dokumen (20% skor AI) dan
                  tetap dicek manual oleh verifikator komunitas.
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-white/80 px-3 py-1 text-[10px] font-medium text-teal-700">
              <BadgeCheck className="size-3.5" />
              Bobot dokumen 20%
            </span>
          </div>
        </div>

        <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Alur pengisian
            </h3>
            <ol className="mt-3 space-y-3">
              {langkah.map((step, index) => {
                const Icon = step.icon;
                return (
                  <li key={step.title} className="flex gap-3">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[10px] font-semibold text-white">
                      {index + 1}
                    </span>
                    <div className="flex gap-2.5">
                      <Icon className="mt-0.5 size-4 shrink-0 text-teal-700" />
                      <div>
                        <p className="text-[11px] font-semibold text-slate-800">
                          {step.title}
                        </p>
                        <p className="mt-0.5 text-[10px] leading-4 text-slate-500">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>

            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
              <div className="flex items-start gap-2">
                <Info className="mt-0.5 size-3.5 shrink-0 text-amber-700" />
                <div>
                  <p className="text-[11px] font-semibold text-amber-900">
                    IG-SALT hanya contoh, bukan Instagram
                  </p>
                  <p className="mt-1 text-[10px] leading-4 text-amber-800">
                    Di prototipe ini <code className="font-mono">IG</code>{" "}
                    dipakai sebagai placeholder dokumen izin/identitas garam.
                    Masukkan nomor surat asli; jangan menyalin contoh ini jika
                    tidak ada di surat.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-end justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-900">
                Contoh nomor &amp; hasil
              </h3>
              <span className="text-[10px] text-slate-400">
                Skor indikator dokumen
              </span>
            </div>

            <div className="mt-3 space-y-2.5">
              {contohDokumen.map((item) => {
                const style = statusStyle[item.status];
                const Icon = style.icon;
                return (
                  <div
                    key={item.nomor}
                    className="rounded-2xl border border-slate-200 bg-slate-50/40 p-3.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="break-all font-mono text-[11px] font-semibold text-slate-800">
                          {item.nomor}
                        </p>
                        <p className="mt-0.5 truncate text-[10px] text-slate-400">
                          {item.kelompok}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-semibold",
                          style.badge,
                        )}
                      >
                        <Icon className="size-2.5" />
                        {item.status}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200/70">
                        <div
                          className={cn("h-full rounded-full", style.bar)}
                          style={{ width: `${item.skor}%` }}
                        />
                      </div>
                      <span className="font-mono text-[9px] text-slate-400">
                        {item.skor}/100
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-end justify-between gap-2">
                      <p className="max-w-[240px] text-[10px] leading-4 text-slate-500">
                        {item.catatan}
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          onUseExample(item.nomor, item.kelompok)
                        }
                        aria-label={`Pakai contoh ${item.nomor}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-teal-200 bg-white px-2 py-1 text-[10px] font-semibold text-teal-700 transition hover:bg-teal-50"
                      >
                        Pakai contoh
                        <ArrowRight className="size-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="mt-3 flex items-start gap-1.5 text-[10px] leading-4 text-slate-400">
              <Info className="mt-0.5 size-3 shrink-0" />
              Skor di atas hanya untuk indikator dokumen. Skor AI total juga
              dipengaruhi warna, tekstur, kadar air, dan salinitas.
            </p>
          </div>
        </div>

        <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:px-7">
          <div className="grid gap-3 sm:grid-cols-3">
            {tips.map((tip) => {
              const Icon = tip.icon;
              return (
                <div key={tip.title} className="flex items-start gap-2">
                  <Icon className="mt-0.5 size-3.5 shrink-0 text-teal-700" />
                  <div>
                    <p className="text-[10px] font-semibold text-slate-700">
                      {tip.title}
                    </p>
                    <p className="mt-0.5 text-[10px] leading-4 text-slate-400">
                      {tip.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
