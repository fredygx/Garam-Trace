"use client";

import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Blocks,
  Camera,
  CheckCircle2,
  CircleAlert,
  CircleX,
  Clock,
  Copy,
  ExternalLink,
  FileText,
  Fingerprint,
  LoaderCircle,
  Lock,
  MapPin,
  ShieldCheck,
  ShieldQuestion,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import type { ComponentType } from "react";
import { useState } from "react";
import { evaluasiIndikator, ringkasanPascaPengesahan } from "@/lib/ai";
import {
  buatBuktiBlockchain,
  getPhantomProvider,
  hashBatchRecord,
  kirimMemoDevnet,
  tandaTanganSimulasi,
} from "@/lib/blockchain";
import { DEMO_WALLETS, LABEL_METODE } from "@/lib/constants";
import type {
  BatchGaram,
  BlockchainProof,
  StatusAmbang,
  ToastType,
  WalletState,
} from "@/lib/types";
import {
  cn,
  delay,
  formatDateTime,
  formatTanggal,
  shortAddress,
  shortHash,
} from "@/lib/utils";
import { ScoreRing } from "./ScoreRing";
import { StatusBadge } from "./StatusBadge";

const ambangStyle: Record<
  StatusAmbang,
  { badge: string; icon: typeof CheckCircle2; iconWrap: string; label: string }
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

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset",
          tone,
        )}
      >
        <Icon className="size-4" />
      </span>
      <div>
        <p className="text-lg font-semibold leading-none text-slate-900">
          {value}
        </p>
        <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-400">
          {label}
        </p>
      </div>
    </div>
  );
}

function InfoCell({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
      <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-1 truncate text-xs font-medium text-slate-800" title={value}>
        {value}
      </p>
      {hint ? (
        <p className="mt-0.5 truncate text-[10px] text-slate-400">{hint}</p>
      ) : null}
    </div>
  );
}

function ProofRow({
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
    <div className="flex items-start justify-between gap-2 py-2">
      <div className="min-w-0">
        <p className="text-[9px] uppercase tracking-wider text-slate-400">
          {label}
        </p>
        <p
          className="mt-0.5 break-all font-mono text-[10px] text-slate-700"
          title={value}
        >
          {display ?? value}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onCopy(value, label)}
        className="shrink-0 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        aria-label={`Salin ${label}`}
      >
        <Copy className="size-3" />
      </button>
    </div>
  );
}

export function TabVerifikator({
  batches,
  wallet,
  onConnect,
  onApprove,
  onDispute,
  onViewCertificate,
  onCopy,
  addToast,
}: {
  batches: BatchGaram[];
  wallet: WalletState;
  onConnect: () => Promise<WalletState | null>;
  onApprove: (batchId: string, proof: BlockchainProof) => void;
  onDispute: (batchId: string, reason: string) => void;
  onViewCertificate: (batchId: string) => void;
  onCopy: (value: string, label: string) => void;
  addToast: (type: ToastType, title: string, description?: string) => void;
}) {
  const pending = batches.filter(
    (batch) => batch.status === "MENUNGGU_PENGESAHAN",
  );
  const terverifikasi = batches.filter(
    (batch) => batch.status === "TERVERIFIKASI",
  );
  const sengketa = batches.filter((batch) => batch.status === "SENGKETA");
  const riwayat = batches
    .filter((batch) => batch.status !== "MENUNGGU_PENGESAHAN")
    .sort(
      (a, b) =>
        new Date(b.diperbaruiPada).getTime() -
        new Date(a.diperbaruiPada).getTime(),
    );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [signing, setSigning] = useState(false);
  const [signingStep, setSigningStep] = useState(0);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");

  const selected =
    (selectedId
      ? batches.find((batch) => batch.id === selectedId)
      : pending[0]) ?? null;

  const handleApprove = async () => {
    if (!selected || selected.status !== "MENUNGGU_PENGESAHAN" || signing) {
      return;
    }

    setSigning(true);
    setSigningStep(0);
    setDisputeOpen(false);

    try {
      let activeWallet = wallet;
      if (!activeWallet.connected || !activeWallet.address) {
        activeWallet = (await onConnect()) ?? activeWallet;
      }
      if (!activeWallet.connected || !activeWallet.address) {
        setSigning(false);
        return;
      }

      const recordHash = await hashBatchRecord(selected);
      await delay(350);
      setSigningStep(1);

      const provider =
        activeWallet.source === "phantom" ? getPhantomProvider() : null;
      const walletPetambak = selected.walletPetambak ?? DEMO_WALLETS.petambak;

      let proof: BlockchainProof;
      let galatDevnet: string | null = null;

      if (provider) {
        addToast(
          "info",
          "Menunggu tanda tangan Phantom",
          "Setujui transaksi memo Solana Devnet pada ekstensi wallet.",
        );
        setSigningStep(2);
        try {
          const tx = await kirimMemoDevnet({
            provider,
            batchId: selected.id,
            recordHash,
            verifier: activeWallet.address,
          });
          proof = buatBuktiBlockchain({
            tandaTangan: {
              signature: tx.signature,
              timestamp: tx.timestamp,
              pesan: tx.memo,
              mode: "phantom",
            },
            recordHash,
            walletPetambak,
            walletVerifikator: activeWallet.address,
            tx,
          });
        } catch (error) {
          const pesan =
            error instanceof Error ? error.message : "Transaksi Devnet gagal.";
          if (/dibatalkan di phantom/i.test(pesan)) throw error;

          galatDevnet = pesan;
          const tandaTangan = await tandaTanganSimulasi({
            batchId: selected.id,
            recordHash,
            verifier: activeWallet.address,
          });
          proof = buatBuktiBlockchain({
            tandaTangan,
            recordHash,
            walletPetambak,
            walletVerifikator: activeWallet.address,
          });
        }
      } else {
        await delay(900);
        const tandaTangan = await tandaTanganSimulasi({
          batchId: selected.id,
          recordHash,
          verifier: activeWallet.address,
        });
        setSigningStep(2);
        await delay(700);
        proof = buatBuktiBlockchain({
          tandaTangan,
          recordHash,
          walletPetambak,
          walletVerifikator: activeWallet.address,
        });
      }

      onApprove(selected.id, proof);
      setSelectedId(null);

      if (proof.mode === "devnet") {
        addToast(
          "success",
          "Tercatat di Solana Devnet",
          `${selected.id} · tx ${shortHash(proof.txHash, 6)}`,
        );
      } else if (galatDevnet) {
        addToast(
          "error",
          "Transaksi Devnet gagal",
          `${galatDevnet} Batch disahkan dengan bukti simulasi.`,
        );
      } else {
        addToast(
          "success",
          "Batch tersahkan dan tercatat",
          `${selected.id} · TxHash ${shortHash(proof.txHash, 6)}`,
        );
      }
    } catch (error) {
      const detail =
        typeof error === "object" && error !== null
          ? (error as { code?: number; message?: string })
          : {};
      const rejected =
        detail.code === 4001 ||
        /reject|denied|dibatalkan|user refused/i.test(detail.message ?? "");
      addToast(
        "error",
        rejected ? "Tanda tangan dibatalkan" : "Pengesahan gagal",
        rejected
          ? "Pengesahan tidak dicatat. Coba lagi saat siap menandatangani."
          : "Pastikan Phantom terhubung dan coba lagi.",
      );
    } finally {
      setSigning(false);
      setSigningStep(0);
    }
  };

  const handleDispute = () => {
    if (!selected) return;
    const clean = reason.trim();
    if (clean.length < 15) {
      setReasonError("Tuliskan alasan minimal 15 karakter agar dapat ditinjau.");
      return;
    }
    setReasonError("");
    onDispute(selected.id, clean);
    addToast(
      "success",
      "Sengketa dicatat",
      `${selected.id} ditandai untuk klarifikasi produsen.`,
    );
    setDisputeOpen(false);
    setReason("");
    setSelectedId(null);
  };

  const signingLabel =
    signingStep === 0
      ? "Menyiapkan hash rekaman batch…"
      : signingStep === 1
        ? wallet.source === "phantom"
          ? "Menunggu tanda tangan di Phantom…"
          : "Membuat tanda tangan simulasi…"
        : wallet.source === "phantom"
          ? "Mengirim transaksi memo ke Solana Devnet…"
          : "Mencatat bukti simulasi…";

  return (
    <div className="animate-fade-up">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-teal-600">
            Tab 02 · Verifikator Komunitas
          </p>
          <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            Antrean Pengesahan
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            Periksa data sebelum masuk blockchain. Pengesahan dilakukan dengan
            menandatangani pesan menggunakan wallet Phantom.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[11px] font-medium text-violet-700">
            <ShieldCheck className="size-3.5" />
            Verifikator
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-500">
            <Wallet className="size-3.5" />
            {wallet.connected && wallet.address
              ? shortAddress(wallet.address, 5)
              : "Wallet belum terhubung"}
          </span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={Clock}
          label="Menunggu"
          value={pending.length}
          tone="bg-amber-50 text-amber-700 ring-amber-600/10"
        />
        <StatCard
          icon={BadgeCheck}
          label="Terverifikasi"
          value={terverifikasi.length}
          tone="bg-emerald-50 text-emerald-700 ring-emerald-600/10"
        />
        <StatCard
          icon={ShieldQuestion}
          label="Sengketa"
          value={sengketa.length}
          tone="bg-rose-50 text-rose-700 ring-rose-600/10"
        />
        <StatCard
          icon={Blocks}
          label="Total Batch"
          value={batches.length}
          tone="bg-slate-100 text-slate-600 ring-slate-500/10"
        />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(290px,0.85fr)_minmax(0,1.5fr)]">
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2 px-1">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/10">
                  <Clock className="size-3.5" />
                </span>
                <h3 className="text-sm font-semibold text-slate-900">
                  Menunggu Pengesahan
                </h3>
              </div>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                {pending.length}
              </span>
            </div>

            <div className="mt-3 space-y-2">
              {pending.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center">
                  <CheckCircle2 className="mx-auto size-6 text-emerald-500" />
                  <p className="mt-2 text-xs font-medium text-slate-700">
                    Antrean bersih
                  </p>
                  <p className="mt-1 text-[10px] leading-4 text-slate-400">
                    Tidak ada batch yang menunggu pengesahan saat ini.
                  </p>
                </div>
              ) : (
                pending.map((batch) => {
                  const active = selected?.id === batch.id;
                  return (
                    <button
                      key={batch.id}
                      type="button"
                      disabled={signing}
                      onClick={() => {
                        setSelectedId(batch.id);
                        setDisputeOpen(false);
                        setReason("");
                        setReasonError("");
                      }}
                      className={cn(
                        "w-full rounded-2xl border p-3.5 text-left transition disabled:cursor-wait",
                        active
                          ? "border-teal-500 bg-teal-50/60 ring-1 ring-teal-500/20"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate font-mono text-[10px] text-slate-400">
                          {batch.id}
                        </p>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold",
                            batch.ai.skor >= 75
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-rose-50 text-rose-700",
                          )}
                        >
                          <Sparkles className="size-2.5" />
                          {batch.ai.skor}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs font-semibold text-slate-900">
                        {batch.namaTambak}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 truncate text-[10px] text-slate-500">
                        <MapPin className="size-2.5 shrink-0" />
                        {batch.lokasi}
                      </p>
                      <div className="mt-2 flex items-center justify-between text-[9px] text-slate-400">
                        <span>{formatTanggal(batch.tanggalPanen)}</span>
                        <span>
                          {batch.ai.faktorRisiko.length} catatan risiko
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 px-1">
              <span className="flex size-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/10">
                <Clock className="size-3.5" />
              </span>
              <h3 className="text-sm font-semibold text-slate-900">
                Riwayat Terbaru
              </h3>
            </div>
            <div className="mt-2 space-y-1">
              {riwayat.length === 0 ? (
                <p className="px-1 py-3 text-[11px] text-slate-400">
                  Belum ada riwayat pengesahan.
                </p>
              ) : (
                riwayat.slice(0, 6).map((batch) => (
                  <button
                    key={batch.id}
                    type="button"
                    disabled={signing}
                    onClick={() => {
                      setSelectedId(batch.id);
                      setDisputeOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 rounded-xl px-2 py-2 text-left transition hover:bg-slate-50 disabled:cursor-wait",
                      selected?.id === batch.id && "bg-slate-50",
                    )}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-mono text-[9px] text-slate-400">
                        {batch.id}
                      </p>
                      <p className="truncate text-[11px] font-medium text-slate-700">
                        {batch.namaTambak}
                      </p>
                    </div>
                    <StatusBadge status={batch.status} size="sm" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {selected ? (
          <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-600">
                    {selected.id}
                  </span>
                  <StatusBadge status={selected.status} size="sm" />
                </div>
                <h3 className="mt-2 text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
                  {selected.namaTambak}
                </h3>
                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3" />
                    {selected.lokasi}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" />
                    Panen {formatTanggal(selected.tanggalPanen)}
                  </span>
                </p>
              </div>
              {selected.status === "TERVERIFIKASI" ? (
                <button
                  type="button"
                  onClick={() => onViewCertificate(selected.id)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-[11px] font-medium text-teal-700 transition hover:bg-teal-100"
                >
                  Lihat sertifikat
                  <ArrowRight className="size-3" />
                </button>
              ) : null}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <InfoCell
                label="Metode"
                value={LABEL_METODE[selected.metodeProduksi]}
              />
              <InfoCell
                label="Kelompok"
                value={selected.indikator.namaKelompok || "—"}
              />
              <InfoCell
                label="Wallet Petambak"
                value={
                  selected.walletPetambak
                    ? shortAddress(selected.walletPetambak, 5)
                    : "—"
                }
                hint={selected.walletPetambak ? "pembuat batch" : undefined}
              />
              <InfoCell
                label="Diajukan"
                value={formatDateTime(selected.dibuatPada)}
              />
            </div>

            <div className="mt-5">
              <div className="flex items-center gap-2">
                <Fingerprint className="size-4 text-teal-700" />
                <h4 className="text-sm font-semibold text-slate-900">
                  Lima Indikator
                </h4>
              </div>
              <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
                {evaluasiIndikator(selected.indikator).map((item) => {
                  const style = ambangStyle[item.status];
                  const Icon = style.icon;
                  return (
                    <div
                      key={item.kunci}
                      className={cn(
                        "rounded-xl border border-slate-200 bg-white p-3",
                        item.kunci === "dokumen" && "sm:col-span-2",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <span
                            className={cn(
                              "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md ring-1 ring-inset",
                              style.iconWrap,
                            )}
                          >
                            <Icon className="size-3" />
                          </span>
                          <div className="min-w-0">
                            <p className="text-[11px] font-medium text-slate-800">
                              {item.label}
                            </p>
                            <p className="mt-0.5 text-[10px] text-slate-500">
                              {item.catatan}
                            </p>
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="max-w-[130px] truncate text-[11px] font-semibold text-slate-700" title={item.nilai}>
                            {item.nilai}
                          </p>
                          <span
                            className={cn(
                              "mt-1 inline-flex rounded-full border px-1.5 py-0.5 text-[9px] font-medium",
                              style.badge,
                            )}
                          >
                            {style.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-4 text-teal-700" />
                    <h4 className="text-xs font-semibold text-slate-900">
                      Hasil Analisis AI
                    </h4>
                  </div>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[9px] text-slate-500 ring-1 ring-slate-200">
                    simulasi
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <ScoreRing score={selected.ai.skor} size={76} />
                  <div className="min-w-0">
                    <p
                      className={cn(
                        "text-[11px] font-semibold leading-4",
                        selected.ai.skor >= 75
                          ? "text-emerald-700"
                          : "text-rose-700",
                      )}
                    >
                      {selected.ai.status}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-400">
                      {formatDateTime(selected.ai.dianalisisPada)}
                    </p>
                  </div>
                </div>
                <p className="mt-2.5 text-[11px] leading-5 text-slate-600">
                  {selected.status === "TERVERIFIKASI"
                    ? ringkasanPascaPengesahan(selected.ai)
                    : selected.ai.ringkasan}
                </p>
                {selected.ai.faktorRisiko.length > 0 ? (
                  <ul className="mt-2 space-y-1">
                    {selected.ai.faktorRisiko.slice(0, 3).map((factor) => (
                      <li
                        key={factor}
                        className="flex items-start gap-1 text-[10px] leading-4 text-amber-700"
                      >
                        <AlertTriangle className="mt-0.5 size-2.5 shrink-0" />
                        {factor}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center gap-2">
                    <FileText className="size-4 text-teal-700" />
                    <h4 className="text-xs font-semibold text-slate-900">
                      Klaim Dokumen
                    </h4>
                  </div>
                  <p className="mt-2 font-mono text-[11px] text-slate-700">
                    {selected.indikator.nomorDokumen || "Belum dilampirkan"}
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-400">
                    {selected.indikator.namaKelompok || "Kelompok belum diisi"}
                  </p>
                  <p className="mt-2 flex items-start gap-1 rounded-lg bg-amber-50 p-2 text-[10px] leading-4 text-amber-800">
                    <CircleAlert className="mt-0.5 size-3 shrink-0" />
                    Cocokkan nomor surat dengan catatan kelompok sebelum
                    mengesahkan.
                  </p>
                </div>

                {selected.indikator.fotoKristalDataUrl ? (
                  <div className="overflow-hidden rounded-2xl border border-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selected.indikator.fotoKristalDataUrl}
                      alt={`Foto kristal garam ${selected.id}`}
                      className="h-32 w-full object-cover"
                    />
                    <p className="flex items-center gap-1 bg-white px-3 py-2 text-[10px] text-slate-500">
                      <Camera className="size-3" />
                      Foto sampel dari produsen
                    </p>
                  </div>
                ) : (
                  <div className="flex h-[74px] items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 text-[10px] text-slate-400">
                    <Camera className="size-3.5" />
                    Foto tidak diunggah (batch demo)
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <div className="flex items-center gap-2">
                <Users className="size-4 text-teal-700" />
                <p className="text-xs font-semibold text-slate-900">
                  Prosedur Pemeriksaan Komunitas
                </p>
              </div>
              <ul className="mt-2 grid gap-1.5 text-[10px] leading-4 text-slate-600 sm:grid-cols-2">
                {[
                  "Bandingkan foto dengan kondisi fisik sampel garam.",
                  "Cek konsistensi warna, tekstur, dan metode produksi.",
                  "Validasi nomor surat dengan catatan kelompok / IG.",
                  "Pastikan parameter ukur berada di rentang yang wajar.",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-1.5">
                    <CheckCircle2 className="mt-0.5 size-3 shrink-0 text-emerald-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4">
              {selected.status === "MENUNGGU_PENGESAHAN" ? (
                signing ? (
                  <div className="rounded-2xl border border-teal-200 bg-teal-50/70 p-4">
                    <div className="flex items-center gap-2.5">
                      <LoaderCircle className="size-4 animate-spin text-teal-700" />
                      <p className="text-xs font-semibold text-teal-900">
                        {signingLabel}
                      </p>
                    </div>
                    <div className="mt-3 flex gap-1.5">
                      {[0, 1, 2].map((step) => (
                        <span
                          key={step}
                          className={cn(
                            "h-1.5 flex-1 rounded-full transition",
                            step <= signingStep
                              ? "bg-teal-600"
                              : "bg-teal-200/70",
                          )}
                        />
                      ))}
                    </div>
                    <p className="mt-2.5 text-[10px] leading-4 text-teal-800/80">
                      Jangan tutup halaman ini. Tanda tangan hanya untuk pesan
                      pengesahan, bukan transfer dana.
                    </p>
                  </div>
                ) : disputeOpen ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-4">
                    <div className="flex items-center gap-2">
                      <ShieldQuestion className="size-4 text-rose-600" />
                      <p className="text-xs font-semibold text-rose-900">
                        Catat Sengketa / Tolak Data
                      </p>
                    </div>
                    <p className="mt-1 text-[10px] leading-4 text-rose-800/80">
                      Jelaskan perbedaan pendapat, data yang meragukan, atau
                      bukti yang belum lengkap.
                    </p>
                    <textarea
                      value={reason}
                      onChange={(event) => {
                        setReason(event.target.value);
                        if (reasonError) setReasonError("");
                      }}
                      rows={3}
                      placeholder="Contoh: Butiran terlalu halus dan nomor dokumen belum sesuai catatan kelompok."
                      className={cn(
                        "mt-2.5 w-full rounded-xl border bg-white px-3 py-2 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:ring-2",
                        reasonError
                          ? "border-rose-300 focus:border-rose-400 focus:ring-rose-500/15"
                          : "border-rose-200 focus:border-rose-400 focus:ring-rose-500/15",
                      )}
                    />
                    {reasonError ? (
                      <p className="mt-1 flex items-center gap-1 text-[10px] text-rose-600">
                        <CircleAlert className="size-3" />
                        {reasonError}
                      </p>
                    ) : null}
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleDispute}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-[11px] font-semibold text-white transition hover:bg-rose-700"
                      >
                        <ShieldQuestion className="size-3.5" />
                        Catat Sengketa
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDisputeOpen(false);
                          setReason("");
                          setReasonError("");
                        }}
                        className="rounded-xl border border-rose-200 bg-white px-3.5 py-2 text-[11px] font-medium text-rose-700 transition hover:bg-rose-50"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => void handleApprove()}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-800 to-emerald-700 px-4 py-3 text-xs font-semibold text-white shadow-sm transition hover:from-teal-900 hover:to-emerald-800"
                      >
                        <ShieldCheck className="size-4" />
                        Sah &amp; Catat ke Blockchain
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDisputeOpen(true);
                          setReason("");
                          setReasonError("");
                        }}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-white px-4 py-3 text-xs font-medium text-rose-700 transition hover:bg-rose-50"
                      >
                        <ShieldQuestion className="size-3.5" />
                        Sengketa / Tolak Data
                      </button>
                    </div>
                    <p className="mt-3 flex items-start gap-1.5 text-[10px] leading-4 text-slate-500">
                      <Lock className="mt-0.5 size-3 shrink-0" />
                      {wallet.connected && wallet.address ? (
                        <>
                          Akan ditandatangani oleh{" "}
                          <span className="font-mono">
                            {shortAddress(wallet.address, 5)}
                          </span>{" "}
                          ({wallet.source === "phantom"
                            ? "Phantom · transaksi memo Solana Devnet, butuh sedikit SOL Devnet"
                            : "simulasi"}
                          ). Hash rekaman dibuat dari seluruh data batch.
                        </>
                      ) : (
                        <>
                          Wallet belum terhubung. Klik pengesahan untuk
                          menghubungkan Phantom atau memakai wallet demo.
                        </>
                      )}
                    </p>
                  </div>
                )
              ) : selected.status === "TERVERIFIKASI" && selected.blockchain ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <BadgeCheck className="size-4 text-emerald-600" />
                      <p className="text-xs font-semibold text-emerald-900">
                        Tercatat di Blockchain
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[9px] font-medium text-emerald-700 ring-1 ring-emerald-200">
                      {selected.blockchain.mode === "devnet"
                        ? "Memo Devnet"
                        : selected.blockchain.mode === "phantom"
                          ? "Phantom"
                          : "Simulasi"}
                    </span>
                  </div>
                  <div className="mt-2 divide-y divide-emerald-100">
                    <ProofRow
                      label="TxHash"
                      value={selected.blockchain.txHash}
                      display={shortHash(selected.blockchain.txHash, 10)}
                      onCopy={onCopy}
                    />
                    <ProofRow
                      label="Record Hash"
                      value={selected.blockchain.recordHash}
                      display={shortHash(selected.blockchain.recordHash, 10)}
                      onCopy={onCopy}
                    />
                    <ProofRow
                      label="Wallet Verifikator"
                      value={selected.blockchain.walletVerifikator}
                      display={shortAddress(
                        selected.blockchain.walletVerifikator,
                        6,
                      )}
                      onCopy={onCopy}
                    />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-emerald-800/80">
                    <span>{formatDateTime(selected.blockchain.disahkanPada)}</span>
                    <span>Slot {selected.blockchain.slot.toLocaleString("id-ID")}</span>
                    {selected.blockchain.explorerUrl ? (
                      <a
                        href={selected.blockchain.explorerUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-900"
                      >
                        <ExternalLink className="size-3" />
                        Lihat di Solana Explorer
                      </a>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => onViewCertificate(selected.id)}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-3.5 py-2 text-[11px] font-semibold text-white transition hover:bg-emerald-800"
                  >
                    Buka sertifikat publik
                    <ArrowRight className="size-3" />
                  </button>
                </div>
              ) : (
                <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-4">
                  <div className="flex items-center gap-2">
                    <ShieldQuestion className="size-4 text-rose-600" />
                    <p className="text-xs font-semibold text-rose-900">
                      Status: {selected.status === "DITOLAK" ? "Ditolak" : "Sengketa"}
                    </p>
                  </div>
                  {selected.alasanSengketa ? (
                    <p className="mt-2 text-[11px] leading-5 text-rose-800">
                      {selected.alasanSengketa}
                    </p>
                  ) : null}
                  {selected.catatanVerifikator ? (
                    <p className="mt-2 rounded-lg bg-white/70 p-2 text-[10px] leading-4 text-rose-700">
                      Catatan verifikator: {selected.catatanVerifikator}
                    </p>
                  ) : null}
                  <p className="mt-2 flex items-center gap-1 text-[10px] text-rose-700/70">
                    <Clock className="size-3" />
                    Menunggu revisi dan pengajuan ulang dari produsen.
                  </p>
                </div>
              )}
            </div>

            {selected.status !== "MENUNGGU_PENGESAHAN" ? (
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="mt-3 text-[10px] font-medium text-slate-500 underline-offset-2 transition hover:text-slate-800 hover:underline"
              >
                ← Kembali ke antrean
              </button>
            ) : null}
          </div>
        ) : (
          <div className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white/70 p-8 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-600/10">
              <ShieldCheck className="size-6" />
            </span>
            <p className="mt-3 text-sm font-semibold text-slate-800">
              Tidak ada batch yang dipilih
            </p>
            <p className="mt-1 max-w-xs text-[11px] leading-5 text-slate-500">
              Pilih batch dari antrean untuk meninjau data dan hasil AI sebelum
              pengesahan.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
