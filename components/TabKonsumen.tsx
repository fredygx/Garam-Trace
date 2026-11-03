"use client";

import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Copy,
  Info,
  MapPin,
  QrCode,
  ScanLine,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { LABEL_METODE } from "@/lib/constants";
import type { BatchGaram, ToastType } from "@/lib/types";
import {
  cn,
  formatDateTime,
  formatTanggal,
  shortHash,
} from "@/lib/utils";
import { SertifikatGaram } from "./SertifikatGaram";
import { StatusBadge } from "./StatusBadge";

export function TabKonsumen({
  batches,
  query,
  onQueryChange,
  onCopy,
  addToast,
}: {
  batches: BatchGaram[];
  query: string;
  onQueryChange: (value: string) => void;
  onCopy: (value: string, label: string) => void;
  addToast: (type: ToastType, title: string, description?: string) => void;
}) {
  const [origin, setOrigin] = useState("");
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Origin browser hanya tersedia setelah mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrigin(window.location.origin);
  }, []);

  const normalized = query.trim().toLowerCase();
  const hasil = normalized
    ? batches.find((batch) => batch.id.toLowerCase() === normalized)
    : null;
  const terverifikasi = batches.filter(
    (batch) => batch.status === "TERVERIFIKASI",
  );
  const featured = terverifikasi[0] ?? null;
  const ditampilkan = hasil ?? (!normalized ? featured : null);
  const sertifikatSiap =
    ditampilkan?.status === "TERVERIFIKASI" && Boolean(ditampilkan.blockchain);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    if (!query.trim()) {
      addToast(
        "info",
        "Masukkan ID batch",
        "Contoh: GRM-AMED-2026-001, atau pilih salah satu contoh di bawah.",
      );
      return;
    }
    window.setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  const pilihBatch = (batchId: string) => {
    onQueryChange(batchId);
    window.setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  return (
    <div className="animate-fade-up">
      <div className="no-print relative overflow-hidden rounded-[28px] border border-teal-900/10 bg-gradient-to-br from-teal-950 via-teal-900 to-emerald-800 p-6 text-white shadow-xl shadow-teal-950/10 sm:p-8">
        <div className="pointer-events-none absolute -right-24 -top-28 size-72 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/4 size-80 rounded-full bg-teal-300/10 blur-3xl" />
        <div className="relative grid gap-7 lg:grid-cols-[1.5fr_0.6fr] lg:items-center">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-teal-200/80">
              Tab 03 · Konsumen &amp; Publik
            </p>
            <h2 className="mt-2 text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
              Telusuri keaslian garam lokal.
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-teal-100/80">
              Masukkan ID batch atau pindai QR pada kemasan untuk melihat asal
              tambak, lima indikator, hasil AI, bukti blockchain, dan riwayat
              distribusi.
            </p>

            <form
              onSubmit={handleSearch}
              className="mt-5 flex flex-col gap-2 sm:flex-row"
            >
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-teal-100/60" />
                <input
                  value={query}
                  onChange={(event) => onQueryChange(event.target.value)}
                  placeholder="Contoh: GRM-AMED-2026-001"
                  aria-label="Cari ID batch garam"
                  className="w-full rounded-2xl border border-white/15 bg-white/10 py-3 pl-11 pr-4 font-mono text-sm text-white uppercase placeholder:font-sans placeholder:normal-case placeholder:text-teal-100/50 outline-none backdrop-blur transition focus:border-emerald-300/60 focus:bg-white/15 focus:ring-2 focus:ring-emerald-300/20"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-teal-900 shadow-lg shadow-teal-950/20 transition hover:bg-emerald-50"
              >
                <Search className="size-4" />
                Telusuri
              </button>
            </form>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider text-teal-200/60">
                Coba:
              </span>
              {batches.slice(0, 3).map((batch) => (
                <button
                  key={batch.id}
                  type="button"
                  onClick={() => pilihBatch(batch.id)}
                  className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 font-mono text-[10px] text-teal-50 transition hover:border-white/30 hover:bg-white/10"
                >
                  {batch.id}
                </button>
              ))}
            </div>
          </div>

          <div className="hidden flex-col items-center justify-center lg:flex">
            <div className="relative flex size-32 items-center justify-center rounded-[28px] border border-white/10 bg-white/5">
              <QrCode className="size-14 text-emerald-200" />
              <span className="absolute inset-x-7 top-1/2 h-px animate-pulse bg-emerald-300/70 shadow-[0_0_12px_2px_rgba(110,231,183,0.5)]" />
              <span className="absolute -bottom-2 rounded-full border border-white/15 bg-teal-950 px-2.5 py-0.5 text-[9px] uppercase tracking-wider text-teal-100/70">
                Scan QR
              </span>
            </div>
            <p className="mt-6 max-w-[190px] text-center text-[10px] leading-4 text-teal-100/60">
              Setiap QR memuat tautan batch dan hash rekaman untuk memeriksa
              integritas data.
            </p>
          </div>
        </div>
      </div>

      <div ref={resultRef}>
        {normalized && !hasil ? (
          <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Search className="size-5" />
            </span>
            <p className="mt-3 text-sm font-semibold text-slate-800">
              Batch “{query.trim()}” tidak ditemukan
            </p>
            <p className="mx-auto mt-1 max-w-md text-[11px] leading-5 text-slate-500">
              Periksa kembali ID batch pada kemasan, atau pilih salah satu
              contoh batch terverifikasi di bawah.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {featured ? (
                <button
                  type="button"
                  onClick={() => pilihBatch(featured.id)}
                  className="rounded-xl bg-teal-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-teal-800"
                >
                  Lihat contoh terverifikasi
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => onQueryChange("")}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Bersihkan pencarian
              </button>
            </div>
          </div>
        ) : null}

        {hasil && hasil.status !== "TERVERIFIKASI" ? (
          <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-amber-50/60 px-5 py-4 sm:px-7">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-slate-500">
                    {hasil.id}
                  </span>
                  <StatusBadge status={hasil.status} size="sm" />
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] text-amber-700">
                  <ShieldCheck className="size-3" />
                  Belum disahkan komunitas
                </span>
              </div>
            </div>
            <div className="p-5 sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold tracking-tight text-slate-900">
                    {hasil.namaTambak}
                  </h3>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                    <MapPin className="size-3.5" />
                    {hasil.lokasi} · panen{" "}
                    {formatTanggal(hasil.tanggalPanen)}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {LABEL_METODE[hasil.metodeProduksi]} · diajukan{" "}
                    {formatDateTime(hasil.dibuatPada)}
                  </p>
                </div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-center">
                  <p className="text-xl font-semibold text-amber-800">
                    {hasil.ai.skor}
                    <span className="text-xs font-normal text-amber-600">
                      /100
                    </span>
                  </p>
                  <p className="text-[9px] uppercase tracking-wider text-amber-600">
                    Skor AI
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-[11px] leading-5 text-amber-900">
                {hasil.status === "MENUNGGU_PENGESAHAN" ? (
                  <>
                    Batch ini masih menunggu pengesahan verifikator komunitas.
                    Sertifikat publik baru diterbitkan setelah pengesahan dan
                    pencatatan bukti blockchain.
                  </>
                ) : hasil.status === "DITOLAK" ? (
                  <>
                    Batch ini ditolak oleh komunitas dan tidak dapat diterbitkan
                    sebagai sertifikat terverifikasi.
                    {hasil.alasanSengketa ? (
                      <span className="mt-1 block font-medium">
                        Alasan: {hasil.alasanSengketa}
                      </span>
                    ) : null}
                  </>
                ) : (
                  <>
                    Batch ini sedang dalam status sengketa. Data belum dapat
                    ditampilkan sebagai sertifikat terverifikasi.
                    {hasil.alasanSengketa ? (
                      <span className="mt-1 block font-medium">
                        Alasan: {hasil.alasanSengketa}
                      </span>
                    ) : null}
                  </>
                )}
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                  <p className="text-[9px] uppercase tracking-wider text-slate-400">
                    Kelompok Produsen
                  </p>
                  <p className="mt-1 text-xs font-medium text-slate-800">
                    {hasil.indikator.namaKelompok || "—"}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                  <p className="text-[9px] uppercase tracking-wider text-slate-400">
                    Klaim Dokumen
                  </p>
                  <p className="mt-1 font-mono text-xs text-slate-800">
                    {hasil.indikator.nomorDokumen || "Belum dilampirkan"}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {featured ? (
                  <button
                    type="button"
                    onClick={() => pilihBatch(featured.id)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-teal-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-teal-800"
                  >
                    Lihat batch terverifikasi
                    <ArrowRight className="size-3.5" />
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => onCopy(hasil.id, "ID batch")}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  <Copy className="size-3.5" />
                  Salin ID batch
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {sertifikatSiap && ditampilkan ? (
          <>
            <div className="no-print mt-5 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-slate-500">
                {normalized ? (
                  <>
                    Hasil untuk{" "}
                    <span className="font-mono font-medium text-slate-800">
                      {ditampilkan.id}
                    </span>
                  </>
                ) : (
                  <>
                    Menampilkan contoh batch terverifikasi. Masukkan ID lain
                    untuk menelusuri.
                  </>
                )}
              </p>
              {normalized ? (
                <button
                  type="button"
                  onClick={() => onQueryChange("")}
                  className="text-[11px] font-medium text-teal-700 underline-offset-2 hover:underline"
                >
                  Reset pencarian
                </button>
              ) : null}
            </div>
            <div className="mt-3">
              <SertifikatGaram
                batch={ditampilkan}
                origin={origin}
                onCopy={onCopy}
              />
            </div>
          </>
        ) : null}
      </div>

      <section className="no-print mt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-slate-900">
              Batch Terverifikasi
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Pilih batch untuk membuka sertifikat digital dan QR publik.
            </p>
          </div>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-500">
            {terverifikasi.length} sertifikat
          </span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {terverifikasi.map((batch) => {
            const active = ditampilkan?.id === batch.id;
            return (
              <button
                key={batch.id}
                type="button"
                onClick={() => pilihBatch(batch.id)}
                className={cn(
                  "group rounded-2xl border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
                  active
                    ? "border-teal-400 bg-teal-50/50 ring-1 ring-teal-500/15"
                    : "border-slate-200/80 bg-white",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-700">
                    <BadgeCheck className="size-3.5" />
                    Terverifikasi
                  </div>
                  <QrCode className="size-4 text-slate-300 transition group-hover:text-teal-600" />
                </div>
                <p className="mt-2 truncate font-mono text-[10px] text-slate-400">
                  {batch.id}
                </p>
                <p className="mt-1 truncate text-sm font-semibold text-slate-900">
                  {batch.namaTambak}
                </p>
                <p className="mt-0.5 flex items-center gap-1 truncate text-[10px] text-slate-500">
                  <MapPin className="size-2.5 shrink-0" />
                  {batch.lokasi}
                </p>
                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[10px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="size-3" />
                    {formatTanggal(batch.tanggalPanen)}
                  </span>
                  <span className="flex items-center gap-1 font-medium text-teal-700">
                    <Sparkles className="size-3" />
                    {batch.ai.skor}/100
                  </span>
                </div>
                {batch.blockchain ? (
                  <p className="mt-1.5 truncate font-mono text-[9px] text-slate-400">
                    tx {shortHash(batch.blockchain.txHash, 6)}
                  </p>
                ) : null}
              </button>
            );
          })}
        </div>
      </section>

      <div className="mt-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-[11px] text-slate-500 sm:grid-cols-3 sm:p-5">
        {[
          {
            icon: ScanLine,
            title: "Pindai QR",
            desc: "QR pada kemasan membuka batch yang tepat.",
          },
          {
            icon: ShieldCheck,
            title: "Cocokkan bukti",
            desc: "TxHash dan record hash dapat disalin untuk diperiksa.",
          },
          {
            icon: Info,
            title: "Pahami batasannya",
            desc: "AI hanya indikasi awal; pengesahan tetap oleh komunitas.",
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="flex items-start gap-2.5">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <Icon className="size-3.5" />
              </span>
              <div>
                <p className="text-[11px] font-semibold text-slate-800">
                  {item.title}
                </p>
                <p className="mt-0.5 text-[10px] leading-4 text-slate-500">
                  {item.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-4 flex items-center justify-center gap-1 text-center text-[10px] text-slate-400">
        <CheckCircle2 className="size-3 text-emerald-500" />
        Prototipe akademik — transaksi blockchain disimulasikan.
      </p>
    </div>
  );
}
