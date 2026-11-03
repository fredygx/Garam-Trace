"use client";

import {
  AlertTriangle,
  BadgeCheck,
  Blocks,
  CalendarDays,
  Camera,
  CheckCircle2,
  CircleX,
  Copy,
  ExternalLink,
  Factory,
  Fingerprint,
  Info,
  Leaf,
  Lock,
  MapPin,
  Printer,
  Sparkles,
  Users,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type { ComponentType, ReactNode } from "react";
import {
  AMBANG_AI,
  DISCLAIMER_AI_TERVERIFIKASI,
  LABEL_METODE,
} from "@/lib/constants";
import { evaluasiIndikator, ringkasanPascaPengesahan } from "@/lib/ai";
import type { BatchGaram, StatusAmbang } from "@/lib/types";
import {
  buildTraceUrl,
  cn,
  formatDateTime,
  formatTanggal,
  shortAddress,
  shortHash,
} from "@/lib/utils";
import { ScoreRing } from "./ScoreRing";
import { TimelineDistribusi } from "./TimelineDistribusi";

const ambangStyle: Record<
  StatusAmbang,
  {
    badge: string;
    icon: ComponentType<{ className?: string }>;
    iconWrap: string;
    label: string;
  }
> = {
  lolos: {
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: CheckCircle2,
    iconWrap: "bg-emerald-50 text-emerald-600 ring-emerald-600/10",
    label: "Lolos",
  },
  tinjau: {
    badge: "border-amber-200 bg-amber-50 text-amber-700",
    icon: AlertTriangle,
    iconWrap: "bg-amber-50 text-amber-600 ring-amber-600/10",
    label: "Tinjau",
  },
  gagal: {
    badge: "border-rose-200 bg-rose-50 text-rose-700",
    icon: CircleX,
    iconWrap: "bg-rose-50 text-rose-600 ring-rose-600/10",
    label: "Gagal",
  },
};

function SectionTitle({
  icon: Icon,
  title,
  description,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-600/10">
        <Icon className="size-4" />
      </span>
      <div>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {description ? (
          <p className="mt-0.5 text-xs leading-5 text-slate-500">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function Fact({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        <Icon className="size-3.5" />
        {label}
      </div>
      <p className="mt-1.5 text-sm font-semibold leading-5 text-slate-900">
        {value}
      </p>
      {hint ? (
        <p className="mt-0.5 text-[11px] leading-4 text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

function CopyRow({
  label,
  value,
  display,
  onCopy,
}: {
  label: string;
  value: string;
  display?: string;
  onCopy: (value: string, label: string) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-2 py-2.5">
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-teal-700/60">
          {label}
        </p>
        <p
          className="mt-0.5 break-all font-mono text-[11px] text-teal-950"
          title={value}
        >
          {display ?? value}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onCopy(value, label)}
        className="no-print shrink-0 rounded-lg border border-teal-200 bg-white/70 p-1.5 text-teal-700 transition hover:bg-white"
        aria-label={`Salin ${label}`}
      >
        <Copy className="size-3" />
      </button>
    </div>
  );
}

function InfoLine({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5">
      <p className="text-[10px] uppercase tracking-wider text-teal-700/60">
        {label}
      </p>
      <p
        className={cn(
          "text-right text-[11px] text-teal-950",
          mono && "font-mono",
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function SertifikatGaram({
  batch,
  origin,
  onCopy,
}: {
  batch: BatchGaram;
  origin: string;
  onCopy: (value: string, label: string) => void;
}) {
  if (!batch.blockchain) return null;

  const proof = batch.blockchain;
  const evaluasi = evaluasiIndikator(batch.indikator);
  const traceUrl = buildTraceUrl(origin, batch.id);
  const sesuai = batch.ai.skor >= AMBANG_AI;
  const adaCatatanIndikator = evaluasi.some((item) => item.status !== "lolos");
  const ringkasanTampil =
    batch.status === "TERVERIFIKASI"
      ? ringkasanPascaPengesahan(batch.ai)
      : batch.ai.ringkasan;
  const disclaimerTampil =
    batch.status === "TERVERIFIKASI"
      ? DISCLAIMER_AI_TERVERIFIKASI
      : batch.ai.disclaimer;

  return (
    <article className="print-area animate-fade-up overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-2xl shadow-slate-900/[0.06]">
      <div className="print-cert-header relative overflow-hidden bg-gradient-to-br from-teal-950 via-teal-900 to-emerald-800 px-6 pb-8 pt-7 text-white sm:px-9">
        <div className="pointer-events-none absolute -right-24 -top-24 size-64 rounded-full bg-emerald-400/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 size-72 rounded-full bg-teal-300/10 blur-3xl" />
        <div className="relative flex flex-col gap-7 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-teal-200/90">
              <BadgeCheck className="size-4" />
              Sertifikat Digital · Garam Lokal
            </div>
            <h2 className="mt-3 text-2xl font-semibold leading-tight tracking-tight sm:text-[32px]">
              Garam Lokal Terverifikasi
            </h2>
            <p className="mt-1.5 flex items-center gap-1.5 text-sm text-teal-100/80">
              <MapPin className="size-4" />
              {batch.lokasi}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-medium text-emerald-200 ring-1 ring-inset ring-emerald-300/25">
                <CheckCircle2 className="size-3.5" />
                Terverifikasi Komunitas
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-teal-50 ring-1 ring-inset ring-white/15">
                {LABEL_METODE[batch.metodeProduksi]}
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1 font-mono text-[11px] text-teal-50 ring-1 ring-inset ring-white/15">
                {batch.id}
              </span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-4 lg:flex-col lg:items-end">
            <div className="rounded-2xl bg-white p-3 shadow-xl shadow-teal-950/20">
              <QRCodeSVG
                value={traceUrl}
                size={112}
                level="M"
                marginSize={1}
                fgColor="#0f3d3a"
                bgColor="#ffffff"
                title={`QR traceability ${batch.id}`}
              />
            </div>
            <p className="max-w-[136px] text-center text-[10px] leading-4 text-teal-100/70 lg:text-right">
              Pindai untuk membuka sertifikat dan riwayat distribusi.
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8 lg:p-10">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Fact
            icon={Leaf}
            label="Asal Tambak"
            value={batch.namaTambak}
            hint={batch.lokasi}
          />
          <Fact
            icon={CalendarDays}
            label="Tanggal Panen"
            value={formatTanggal(batch.tanggalPanen)}
            hint={`Batch dibuat ${formatDateTime(batch.dibuatPada)}`}
          />
          <Fact
            icon={Factory}
            label="Metode Produksi"
            value={LABEL_METODE[batch.metodeProduksi]}
            hint="Sesuai klaim produsen"
          />
          <Fact
            icon={Users}
            label="Kelompok Produsen"
            value={batch.indikator.namaKelompok || "—"}
            hint={batch.indikator.nomorDokumen || "Dokumen belum ada"}
          />
        </div>

        {batch.indikator.fotoKristalDataUrl ? (
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/50 sm:flex">
            <div className="sm:w-56 lg:w-64">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={batch.indikator.fotoKristalDataUrl}
                alt={`Foto sampel kristal garam ${batch.id}`}
                className="h-48 w-full object-cover sm:h-full"
              />
            </div>
            <div className="flex flex-1 flex-col justify-between gap-3 p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Foto Sampel Kristal
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    Dokumentasi visual dari produsen
                  </p>
                </div>
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[9px] font-medium text-slate-500">
                  Off-chain
                </span>
              </div>
              <p className="text-[11px] leading-5 text-slate-500">
                Foto dipakai AI sebagai sinyal warna dan tekstur, lalu diperiksa
                verifikator. File asli tidak ditulis ke blockchain; hash foto
                ikut menyusun hash rekaman.
              </p>
              <p className="flex items-center gap-1 text-[10px] text-slate-400">
                <Camera className="size-3" />
                Disimpan di browser bersama data batch
              </p>
            </div>
          </div>
        ) : null}

        <div className="mt-8">
          <SectionTitle
            icon={Fingerprint}
            title="Hasil Uji 5 Indikator Pengetahuan Lokal"
            description="Gabungan observasi langsung, alat ukur, dan klaim dokumen yang diperiksa komunitas."
          />
          {adaCatatanIndikator ? (
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-[10px] leading-4 text-amber-900">
              <Info className="mt-0.5 size-3.5 shrink-0 text-amber-700" />
              <p>
                Batch ini <strong>sudah disahkan komunitas</strong>. Status{" "}
                <strong>Tinjau</strong> adalah catatan hasil pemeriksaan
                indikator yang perlu dipantau—bukan berarti batch masih menunggu
                pengesahan.
              </p>
            </div>
          ) : null}
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
            <div className="hidden grid-cols-[1fr_140px_100px] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 sm:grid">
              <span>Indikator</span>
              <span>Nilai</span>
              <span className="text-right">Status Indikator</span>
            </div>
            <div className="divide-y divide-slate-100">
              {evaluasi.map((item) => {
                const style = ambangStyle[item.status];
                const Icon = style.icon;
                return (
                  <div
                    key={item.kunci}
                    className="grid gap-3 px-4 py-3.5 sm:grid-cols-[1fr_140px_100px] sm:items-center sm:gap-4"
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={cn(
                          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset",
                          style.iconWrap,
                        )}
                      >
                        <Icon className="size-4" />
                      </span>
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {item.label}
                        </p>
                        <p className="mt-0.5 text-[11px] leading-4 text-slate-500">
                          {item.catatan}
                        </p>
                      </div>
                    </div>
                    <p className="pl-11 text-sm font-semibold text-slate-700 sm:pl-0">
                      {item.nilai}
                    </p>
                    <div className="pl-11 sm:flex sm:justify-end sm:pl-0">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
                          style.badge,
                        )}
                      >
                        <Icon className="size-3" />
                        {style.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <SectionTitle
                icon={Sparkles}
                title="Analisis AI"
                description="Indikasi awal dari citra dan parameter ukur."
              />
              <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[10px] font-medium text-slate-500">
                AI · simulasi
              </span>
            </div>
            <div className="mt-4 flex items-center gap-4">
              <ScoreRing score={batch.ai.skor} size={84} />
              <div>
                <p
                  className={cn(
                    "text-sm font-semibold leading-5",
                    sesuai ? "text-emerald-700" : "text-rose-700",
                  )}
                >
                  {batch.ai.status}
                </p>
                <p className="mt-1 text-[11px] leading-4 text-slate-500">
                  {batch.ai.model}
                </p>
                <p className="text-[11px] text-slate-400">
                  {formatDateTime(batch.ai.dianalisisPada)}
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              {ringkasanTampil}
            </p>
            {batch.ai.faktorRisiko.length > 0 ? (
              <ul className="mt-3 space-y-1.5">
                {batch.ai.faktorRisiko.map((factor) => (
                  <li
                    key={factor}
                    className="flex items-start gap-2 text-[11px] leading-5 text-slate-500"
                  >
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
                    {factor}
                  </li>
                ))}
              </ul>
            ) : null}
            <p
              className={cn(
                "mt-4 rounded-xl border p-3 text-[11px] leading-5",
                batch.status === "TERVERIFIKASI"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : "border-amber-200 bg-amber-50 text-amber-800",
              )}
            >
              {disclaimerTampil}
            </p>
          </div>

          <div className="rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50/90 to-emerald-50/40 p-5">
            <div className="flex items-start justify-between gap-3">
              <SectionTitle
                icon={Blocks}
                title="Bukti Blockchain"
                description="Integritas catatan setelah pengesahan komunitas."
              />
              <span className="shrink-0 rounded-full border border-teal-200 bg-white/80 px-2.5 py-0.5 text-[10px] font-medium text-teal-700">
                Solana Devnet
              </span>
            </div>
            <div className="mt-2 divide-y divide-teal-100/80">
              <CopyRow
                label={
                  proof.mode === "devnet"
                    ? "TxHash (Solana Devnet)"
                    : "TxHash (simulasi)"
                }
                value={proof.txHash}
                display={shortHash(proof.txHash, 10)}
                onCopy={onCopy}
              />
              <CopyRow
                label="Record Hash (SHA-256)"
                value={proof.recordHash}
                display={shortHash(proof.recordHash, 10)}
                onCopy={onCopy}
              />
              <CopyRow
                label="Wallet Petambak"
                value={proof.walletPetambak}
                display={shortAddress(proof.walletPetambak, 6)}
                onCopy={onCopy}
              />
              <CopyRow
                label="Wallet Verifikator"
                value={proof.walletVerifikator}
                display={shortAddress(proof.walletVerifikator, 6)}
                onCopy={onCopy}
              />
              <InfoLine
                label="Waktu Pengesahan"
                value={formatDateTime(proof.disahkanPada)}
              />
              <InfoLine label="Slot" value={proof.slot.toLocaleString("id-ID")} mono />
              <InfoLine
                label="Mode"
                value={
                  proof.mode === "devnet"
                    ? "Memo Program · Solana Devnet"
                    : proof.mode === "phantom"
                      ? "Phantom signMessage"
                      : "Simulasi tanda tangan"
                }
              />
            </div>
            {proof.explorerUrl ? (
              <a
                href={proof.explorerUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-teal-300 bg-white/80 px-3 py-1.5 text-[11px] font-medium text-teal-800 transition hover:bg-white"
              >
                <ExternalLink className="size-3.5" />
                Lihat transaksi di Solana Explorer
              </a>
            ) : null}
            <p className="mt-3 flex items-start gap-2 text-[11px] leading-5 text-teal-800/80">
              <Lock className="mt-0.5 size-3.5 shrink-0" />
              Catatan telah disahkan komunitas. Perubahan data akan menghasilkan
              hash yang berbeda.
            </p>
          </div>
        </div>

        <div className="mt-8">
          <SectionTitle
            icon={Factory}
            title="Riwayat Distribusi"
            description="Dari tambak hingga konsumen, dicatat bertahap sebagai bukti ketertelusuran."
          />
          <div className="mt-4 rounded-2xl border border-slate-200 p-5">
            <TimelineDistribusi riwayat={batch.distribusi} />
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-4 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] text-slate-500">
              Diterbitkan {formatDateTime(proof.disahkanPada)} · Program{" "}
              <span className="font-mono">{shortHash(proof.programId, 6)}</span>
            </p>
            <p className="mt-0.5 text-[10px] leading-4 text-slate-400">
              {proof.mode === "devnet"
                ? "Transaksi memo tercatat di Solana Devnet; data off-chain disimpan di browser. Bukan sertifikat resmi."
                : "Prototipe akademik: transaksi blockchain disimulasikan, data off-chain disimpan di browser. Bukan sertifikat resmi."}
            </p>
          </div>
          <div className="no-print flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onCopy(traceUrl, "Tautan traceability")}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <Copy className="size-3.5" />
              Salin tautan
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-full bg-teal-900 px-4 py-2 text-xs font-medium text-white transition hover:bg-teal-800"
            >
              <Printer className="size-3.5" />
              Cetak sertifikat
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
