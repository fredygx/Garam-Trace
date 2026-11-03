"use client";

import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Blocks,
  BookOpen,
  Camera,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Factory,
  FileText,
  FlaskConical,
  Info,
  Leaf,
  LoaderCircle,
  Lock,
  MapPin,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Sprout,
  Thermometer,
  Upload,
  Users,
  Wallet,
  Waves,
  X,
} from "lucide-react";
import type { ComponentType } from "react";
import { useEffect, useRef, useState } from "react";
import { analisisGaram } from "@/lib/ai";
import {
  AMBANG_5_INDIKATOR,
  DEMO_WALLETS,
  LABEL_METODE,
} from "@/lib/constants";
import type {
  AIResult,
  BatchGaram,
  MetodeProduksi,
  TeksturButiran,
  ToastType,
  WarnaKristal,
  WalletState,
} from "@/lib/types";
import {
  cn,
  delay,
  fileToDataUrl,
  formatDateTime,
  generateBatchId,
  shortAddress,
  todayIso,
} from "@/lib/utils";
import { ScoreRing } from "./ScoreRing";
import { StatusBadge } from "./StatusBadge";
import { TutorialDokumen } from "./TutorialDokumen";

interface FormState {
  id: string;
  namaTambak: string;
  lokasi: string;
  tanggalPanen: string;
  metodeProduksi: MetodeProduksi;
  warnaKristal: WarnaKristal;
  teksturButiran: TeksturButiran;
  kadarAir: string;
  salinitas: string;
  nomorDokumen: string;
  namaKelompok: string;
}

const emptyForm = (): FormState => ({
  id: "",
  namaTambak: "",
  lokasi: "",
  tanggalPanen: "",
  metodeProduksi: "kristalisasi_tradisional",
  warnaKristal: "putih_tulang",
  teksturButiran: "kasar_krosok",
  kadarAir: "",
  salinitas: "",
  nomorDokumen: "",
  namaKelompok: "",
});

const analysisStages = [
  "Membaca citra kristal garam…",
  "Mengekstrak sinyal warna dan tekstur…",
  "Menghitung parameter ukur dan dokumen…",
  "Menyusun indikasi awal…",
];

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15";

const inputErrorClass =
  "border-rose-300 focus:border-rose-400 focus:ring-rose-500/15";

function SectionStep({
  number,
  title,
  description,
  icon: Icon,
  children,
}: {
  number: string;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-slate-100 pt-6 first:border-t-0 first:pt-0">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
          <Icon className="size-4" />
        </span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Langkah {number}
          </p>
          <h3 className="mt-0.5 text-sm font-semibold text-slate-900">
            {title}
          </h3>
          <p className="mt-0.5 text-xs leading-5 text-slate-500">
            {description}
          </p>
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label
          htmlFor={htmlFor}
          className="text-xs font-semibold text-slate-700"
        >
          {label}
        </label>
        {hint ? (
          <span className="text-[10px] text-slate-400">{hint}</span>
        ) : null}
      </div>
      {children}
      {error ? (
        <p className="mt-1 flex items-center gap-1 text-[11px] text-rose-600">
          <CircleAlert className="size-3" />
          {error}
        </p>
      ) : null}
    </div>
  );
}

function RadioCard({
  name,
  checked,
  onChange,
  title,
  description,
  icon: Icon,
  recommended,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  recommended?: boolean;
}) {
  return (
    <label
      className={cn(
        "relative flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition",
        checked
          ? "border-teal-500 bg-teal-50/60 ring-1 ring-teal-500/20"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60",
      )}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <span
        className={cn(
          "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset",
          checked
            ? "bg-teal-600 text-white ring-teal-600/20"
            : "bg-slate-50 text-slate-500 ring-slate-200",
        )}
      >
        <Icon className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-1.5">
          <span className="text-sm font-medium text-slate-900">{title}</span>
          {recommended ? (
            <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-emerald-700">
              Tradisional
            </span>
          ) : null}
        </span>
        <span className="mt-1 block text-[11px] leading-4 text-slate-500">
          {description}
        </span>
      </span>
      <span
        className={cn(
          "ml-auto mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border transition",
          checked ? "border-teal-600 bg-teal-600" : "border-slate-300",
        )}
      >
        {checked ? <span className="size-1.5 rounded-full bg-white" /> : null}
      </span>
    </label>
  );
}

function InputWithSuffix({
  id,
  value,
  onChange,
  placeholder,
  suffix,
  invalid,
  step = "0.1",
  className,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  suffix: string;
  invalid?: boolean;
  step?: string;
  className?: string;
}) {
  return (
    <div className="relative">
      <input
        id={id}
        type="number"
        inputMode="decimal"
        min={0}
        max={100}
        step={step}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={cn(
          inputClass,
          "pr-12 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          className,
          invalid && inputErrorClass,
        )}
      />
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-medium text-slate-400">
        {suffix}
      </span>
    </div>
  );
}

export function TabPetambak({
  batches,
  wallet,
  onConnect,
  onSubmit,
  onViewQueue,
  onViewCertificate,
  addToast,
}: {
  batches: BatchGaram[];
  wallet: WalletState;
  onConnect: () => Promise<WalletState | null>;
  onSubmit: (batch: BatchGaram) => void;
  onViewQueue: () => void;
  onViewCertificate: (batchId: string) => void;
  addToast: (type: ToastType, title: string, description?: string) => void;
}) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [foto, setFoto] = useState<string | undefined>(undefined);
  const [fotoName, setFotoName] = useState("");
  const [fotoLoading, setFotoLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [stage, setStage] = useState(0);
  const [result, setResult] = useState<AIResult | null>(null);
  const [submitted, setSubmitted] = useState<BatchGaram | null>(null);
  const [revisiId, setRevisiId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Isi ID dan tanggal setelah mount agar tidak mismatch dengan hasil SSR.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm((prev) => ({
      ...prev,
      id: prev.id || generateBatchId(),
      tanggalPanen: prev.tanggalPanen || todayIso(),
    }));
  }, []);

  const update = <K extends keyof FormState>(
    key: K,
    value: FormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const gunakanContohDokumen = (nomor: string, kelompok: string) => {
    update("nomorDokumen", nomor);
    update("namaKelompok", kelompok);
    addToast(
      "info",
      "Contoh dokumen dimasukkan",
      "Ganti dengan nomor surat asli sebelum mengajukan.",
    );
    window.setTimeout(() => {
      const input = document.getElementById("nomor-dokumen");
      input?.scrollIntoView({ behavior: "smooth", block: "center" });
      input?.focus();
    }, 100);
  };

  const resetForm = () => {
    setForm({ ...emptyForm(), id: generateBatchId(), tanggalPanen: todayIso() });
    setFoto(undefined);
    setFotoName("");
    setResult(null);
    setSubmitted(null);
    setRevisiId(null);
    setErrors({});
    setStage(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const mulaiRevisi = (batch: BatchGaram) => {
    setForm({
      id: batch.id,
      namaTambak: batch.namaTambak,
      lokasi: batch.lokasi,
      tanggalPanen: batch.tanggalPanen,
      metodeProduksi: batch.metodeProduksi,
      warnaKristal: batch.indikator.warnaKristal,
      teksturButiran: batch.indikator.teksturButiran,
      kadarAir: String(batch.indikator.kadarAirPersen).replace(".", ","),
      salinitas: String(batch.indikator.salinitasPersen).replace(".", ","),
      nomorDokumen: batch.indikator.nomorDokumen,
      namaKelompok: batch.indikator.namaKelompok,
    });
    setFoto(batch.indikator.fotoKristalDataUrl);
    setFotoName(
      batch.indikator.fotoKristalDataUrl ? "Foto dari pengajuan sebelumnya" : "",
    );
    setRevisiId(batch.id);
    setResult(null);
    setSubmitted(null);
    setErrors({});
    setStage(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
    addToast(
      "info",
      "Mode revisi aktif",
      `Perbaiki data ${batch.id}, lalu ajukan ulang ke antrean verifikator.`,
    );
    window.setTimeout(() => {
      document
        .getElementById("form-input-batch")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      addToast("error", "Format tidak didukung", "Gunakan foto JPG, PNG, atau WEBP.");
      return;
    }
    setFotoLoading(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      setFoto(dataUrl);
      setFotoName(file.name);
      addToast("success", "Foto siap dianalisis", "Citra akan dipakai sebagai sinyal warna dan tekstur.");
    } catch {
      addToast("error", "Gagal membaca foto", "Coba pilih file lain.");
    } finally {
      setFotoLoading(false);
    }
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.id.trim()) next.id = "ID batch wajib diisi.";
    else if (
      form.id.trim().toLowerCase() !== revisiId?.toLowerCase() &&
      batches.some(
        (batch) => batch.id.toLowerCase() === form.id.trim().toLowerCase(),
      )
    ) {
      next.id = "ID batch sudah digunakan. Gunakan ID lain.";
    }
    if (!form.namaTambak.trim()) next.namaTambak = "Nama tambak wajib diisi.";
    if (!form.lokasi.trim()) next.lokasi = "Lokasi wajib diisi.";
    if (!form.tanggalPanen) next.tanggalPanen = "Tanggal panen wajib diisi.";

    const kadarAir = Number(form.kadarAir.replace(",", "."));
    if (!form.kadarAir.trim() || !Number.isFinite(kadarAir)) {
      next.kadarAir = "Masukkan angka kadar air.";
    } else if (kadarAir < 0 || kadarAir > 100) {
      next.kadarAir = "Nilai harus 0–100%.";
    }

    const salinitas = Number(form.salinitas.replace(",", "."));
    if (!form.salinitas.trim() || !Number.isFinite(salinitas)) {
      next.salinitas = "Masukkan angka salinitas.";
    } else if (salinitas < 0 || salinitas > 100) {
      next.salinitas = "Nilai harus 0–100%.";
    }

    if (!form.nomorDokumen.trim())
      next.nomorDokumen = "Nomor surat / dokumen wajib diisi.";
    if (!form.namaKelompok.trim())
      next.namaKelompok = "Nama kelompok wajib diisi.";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleAnalyzeSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (analyzing) return;
    if (!validate()) {
      addToast(
        "error",
        "Data belum lengkap",
        "Periksa kembali field yang ditandai merah.",
      );
      return;
    }

    setAnalyzing(true);
    setResult(null);
    setSubmitted(null);
    setStage(0);

    try {
      await delay(650);
      setStage(1);
      await delay(650);
      setStage(2);

      const indikator = {
        warnaKristal: form.warnaKristal,
        teksturButiran: form.teksturButiran,
        kadarAirPersen: Number(form.kadarAir.replace(",", ".")),
        salinitasPersen: Number(form.salinitas.replace(",", ".")),
        nomorDokumen: form.nomorDokumen.trim(),
        namaKelompok: form.namaKelompok.trim(),
        fotoKristalDataUrl: foto,
      };

      const ai = await analisisGaram(indikator, foto);
      setStage(3);
      await delay(550);

      const now = new Date().toISOString();
      const batch: BatchGaram = {
        id: form.id.trim().toUpperCase(),
        namaTambak: form.namaTambak.trim(),
        lokasi: form.lokasi.trim(),
        tanggalPanen: form.tanggalPanen,
        metodeProduksi: form.metodeProduksi,
        indikator,
        ai,
        status: "MENUNGGU_PENGESAHAN",
        walletPetambak: wallet.address ?? DEMO_WALLETS.petambak,
        distribusi: [],
        dibuatPada: now,
        diperbaruiPada: now,
      };

      setResult(ai);
      setSubmitted(batch);
      onSubmit(batch);
      addToast(
        "success",
        revisiId ? "Revisi batch diajukan" : "Batch diajukan ke komunitas",
        revisiId
          ? `Data ${batch.id} diperbarui dan kembali ke antrean verifikator. AI memberi skor ${ai.skor}/100.`
          : wallet.connected
            ? `AI memberi skor ${ai.skor}/100. Menunggu pengesahan verifikator.`
            : `AI memberi skor ${ai.skor}/100. Wallet demo dipakai karena Phantom belum terhubung.`,
      );
      setRevisiId(null);

      if (typeof window !== "undefined" && window.innerWidth < 1024) {
        window.setTimeout(() => {
          document
            .getElementById("panel-analisis-ai")
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 150);
      }
    } catch {
      addToast(
        "error",
        "Analisis gagal",
        "Terjadi kendala saat memproses data. Silakan coba lagi.",
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const daftarBatch = [...batches]
    .sort(
      (a, b) =>
        new Date(b.dibuatPada).getTime() - new Date(a.dibuatPada).getTime(),
    )
    .slice(0, 6);

  const sesuai = result ? result.skor >= 75 : false;

  return (
    <div className="animate-fade-up">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(320px,1fr)]">
        <div
          id="form-input-batch"
          className="scroll-mt-24 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-7"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-teal-600">
                Tab 01 · Produsen
              </p>
              <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
                Input Batch Garam
              </h2>
              <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">
                Catat identitas batch dan lima indikator pengetahuan lokal.
                Analisis AI akan menjadi indikasi awal sebelum komunitas
                mengesahkan.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-[11px] font-medium text-teal-700">
              <Sprout className="size-3.5" />
              Petambak Garam
            </span>
          </div>

          {revisiId ? (
            <div className="mt-5 flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-3.5">
              <div className="flex items-start gap-2.5">
                <CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-700" />
                <div>
                  <p className="text-xs font-semibold text-amber-900">
                    Mode revisi · {revisiId}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-5 text-amber-800">
                    Perbaiki data yang disengketakan. Setelah diajukan, batch
                    kembali ke antrean verifikator dengan hash rekaman baru.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-amber-200 bg-white px-3 py-1.5 text-[11px] font-medium text-amber-800 transition hover:bg-amber-100"
              >
                Batal revisi
              </button>
            </div>
          ) : null}

          <form onSubmit={handleAnalyzeSubmit} className="mt-7 space-y-6">
            <SectionStep
              number="01"
              title="Identitas Batch"
              description="Informasi dasar yang akan menjadi identitas produk di blockchain."
              icon={FileText}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="ID Batch"
                  htmlFor="id-batch"
                  hint={
                    revisiId
                      ? "ID tetap · pengajuan ulang"
                      : "Unik · tidak dapat diubah"
                  }
                  error={errors.id}
                >
                  <input
                    id="id-batch"
                    value={form.id}
                    readOnly={Boolean(revisiId)}
                    onChange={(event) =>
                      update("id", event.target.value)
                    }
                    placeholder="GRM-AMED-2026-001"
                    className={cn(
                      inputClass,
                      "font-mono uppercase",
                      revisiId && "bg-slate-50 text-slate-500",
                      errors.id && inputErrorClass,
                    )}
                  />
                </Field>
                <Field
                  label="Tanggal Panen"
                  htmlFor="tanggal-panen"
                  error={errors.tanggalPanen}
                >
                  <input
                    id="tanggal-panen"
                    type="date"
                    value={form.tanggalPanen}
                    onChange={(event) =>
                      update("tanggalPanen", event.target.value)
                    }
                    className={cn(
                      inputClass,
                      errors.tanggalPanen && inputErrorClass,
                    )}
                  />
                </Field>
                <Field
                  label="Nama Tambak"
                  htmlFor="nama-tambak"
                  error={errors.namaTambak}
                >
                  <input
                    id="nama-tambak"
                    value={form.namaTambak}
                    onChange={(event) =>
                      update("namaTambak", event.target.value)
                    }
                    placeholder="Tambak Garam Amed"
                    className={cn(
                      inputClass,
                      errors.namaTambak && inputErrorClass,
                    )}
                  />
                </Field>
                <Field
                  label="Lokasi"
                  htmlFor="lokasi"
                  error={errors.lokasi}
                >
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="lokasi"
                      value={form.lokasi}
                      onChange={(event) =>
                        update("lokasi", event.target.value)
                      }
                      placeholder="Amed, Karangasem, Bali"
                      className={cn(
                        inputClass,
                        "pl-9",
                        errors.lokasi && inputErrorClass,
                      )}
                    />
                  </div>
                </Field>
              </div>

              <div className="mt-4">
                <p className="mb-1.5 text-xs font-semibold text-slate-700">
                  Metode Produksi
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {(
                    [
                      {
                        value: "kristalisasi_tradisional",
                        icon: Waves,
                        desc: "Penguapan dan kristalisasi alami di tambak.",
                      },
                      {
                        value: "meja_geomembran",
                        icon: Factory,
                        desc: "Kristalisasi di atas meja geomembran.",
                      },
                    ] as const
                  ).map((option) => {
                    const Icon = option.icon;
                    const active = form.metodeProduksi === option.value;
                    return (
                      <label
                        key={option.value}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5 transition",
                          active
                            ? "border-teal-500 bg-teal-50/60"
                            : "border-slate-200 hover:border-slate-300",
                        )}
                      >
                        <input
                          type="radio"
                          name="metode"
                          className="sr-only"
                          checked={active}
                          onChange={() =>
                            update("metodeProduksi", option.value)
                          }
                        />
                        <Icon
                          className={cn(
                            "size-4",
                            active ? "text-teal-700" : "text-slate-400",
                          )}
                        />
                        <span className="min-w-0">
                          <span className="block text-xs font-medium text-slate-800">
                            {LABEL_METODE[option.value]}
                          </span>
                          <span className="mt-0.5 block text-[10px] leading-4 text-slate-500">
                            {option.desc}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </SectionStep>

            <SectionStep
              number="02"
              title="Lima Indikator Pengetahuan Lokal"
              description="Gabungan observasi langsung, alat ukur, dan klaim dokumen."
              icon={BadgeCheck}
            >
              <div className="space-y-5">
                <div>
                  <div className="mb-2 flex items-baseline justify-between gap-3">
                    <p className="text-xs font-semibold text-slate-700">
                      1. Warna Kristal
                    </p>
                    <span className="text-[10px] text-slate-400">
                      Observasi langsung
                    </span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <RadioCard
                      name="warna"
                      checked={form.warnaKristal === "putih_tulang"}
                      onChange={() => update("warnaKristal", "putih_tulang")}
                      title="Putih Tulang Alami"
                      description="Sedikit krem, tidak menyilaukan — ciri garam tambak."
                      icon={Leaf}
                      recommended
                    />
                    <RadioCard
                      name="warna"
                      checked={form.warnaKristal === "putih_bersih"}
                      onChange={() => update("warnaKristal", "putih_bersih")}
                      title="Putih Bersih"
                      description="Sangat putih; perlu dicocokkan dengan tekstur."
                      icon={Sparkles}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-baseline justify-between gap-3">
                    <p className="text-xs font-semibold text-slate-700">
                      2. Tekstur & Ukuran Butiran
                    </p>
                    <span className="text-[10px] text-slate-400">
                      Observasi langsung
                    </span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <RadioCard
                      name="tekstur"
                      checked={form.teksturButiran === "kasar_krosok"}
                      onChange={() => update("teksturButiran", "kasar_krosok")}
                      title="Kasar / Krosok"
                      description="Butiran tidak seragam — ciri garam tradisional."
                      icon={Waves}
                      recommended
                    />
                    <RadioCard
                      name="tekstur"
                      checked={form.teksturButiran === "halus_merata"}
                      onChange={() => update("teksturButiran", "halus_merata")}
                      title="Halus Merata"
                      description="Butiran kecil seragam; sering muncul pada garam rafinasi."
                      icon={Sparkles}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="3. Kadar Air"
                    htmlFor="kadar-air"
                    hint="Moisture meter · SNI ≤ 7%"
                    error={errors.kadarAir}
                  >
                    <div className="relative">
                      <Thermometer className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                      <InputWithSuffix
                        id="kadar-air"
                        value={form.kadarAir}
                        onChange={(value) => update("kadarAir", value)}
                        placeholder="6.5"
                        suffix="%"
                        invalid={Boolean(errors.kadarAir)}
                        className="pl-9"
                      />
                    </div>
                  </Field>
                  <Field
                    label="4. Salinitas / NaCl"
                    htmlFor="salinitas"
                    hint="Salinometer · SNI ≥ 94%"
                    error={errors.salinitas}
                  >
                    <div className="relative">
                      <FlaskConical className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                      <InputWithSuffix
                        id="salinitas"
                        value={form.salinitas}
                        onChange={(value) => update("salinitas", value)}
                        placeholder="95.2"
                        suffix="%"
                        invalid={Boolean(errors.salinitas)}
                        className="pl-9"
                      />
                    </div>
                  </Field>
                </div>

                <div>
                  <div className="mb-2 flex items-baseline justify-between gap-3">
                    <p className="text-xs font-semibold text-slate-700">
                      5. Klaim Dokumen / Sertifikat Asal Lahan
                    </p>
                    <span className="text-[10px] text-slate-400">
                      Dokumen · diverifikasi manual
                    </span>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label="Nomor Surat Kelompok / Izin Garam"
                      htmlFor="nomor-dokumen"
                      hint="Sesuai surat asli"
                      error={errors.nomorDokumen}
                    >
                      <div className="relative">
                        <FileText className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                        <input
                          id="nomor-dokumen"
                          value={form.nomorDokumen}
                          onChange={(event) =>
                            update("nomorDokumen", event.target.value)
                          }
                          placeholder="Contoh: IG-SALT-BALI/041/2026"
                          className={cn(
                            inputClass,
                            "pl-9 font-mono text-xs",
                            errors.nomorDokumen && inputErrorClass,
                          )}
                        />
                      </div>
                    </Field>
                    <Field
                      label="Nama Kelompok Tani"
                      htmlFor="nama-kelompok"
                      hint="Sesuai surat"
                      error={errors.namaKelompok}
                    >
                      <div className="relative">
                        <Users className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                        <input
                          id="nama-kelompok"
                          value={form.namaKelompok}
                          onChange={(event) =>
                            update("namaKelompok", event.target.value)
                          }
                          placeholder="Kelompok Petambak Amed"
                          className={cn(
                            inputClass,
                            "pl-9",
                            errors.namaKelompok && inputErrorClass,
                          )}
                        />
                      </div>
                    </Field>
                  </div>
                  <div className="mt-2 flex flex-wrap items-start justify-between gap-2">
                    <p className="flex items-start gap-1.5 text-[10px] leading-4 text-slate-400">
                      <Info className="mt-0.5 size-3 shrink-0" />
                      Verifikator akan mencocokkan nomor surat dengan catatan
                      komunitas sebelum pengesahan.
                    </p>
                    <a
                      href="#tutorial-dokumen"
                      className="inline-flex shrink-0 items-center gap-1 text-[10px] font-semibold text-teal-700 underline-offset-2 hover:underline"
                    >
                      <BookOpen className="size-3" />
                      Panduan &amp; contoh
                    </a>
                  </div>
                </div>
              </div>
            </SectionStep>

            <SectionStep
              number="03"
              title="Foto Kristal untuk Analisis AI"
              description="Citra menjadi sinyal tambahan untuk warna dan tekstur; bukan satu-satunya dasar penilaian."
              icon={Camera}
            >
              <div
                className={cn(
                  "relative overflow-hidden rounded-2xl border-2 border-dashed p-4 transition",
                  foto
                    ? "border-teal-200 bg-teal-50/30"
                    : "border-slate-200 bg-slate-50/60",
                )}
              >
                {foto ? (
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={foto}
                      alt="Pratinjau kristal garam"
                      className="h-32 w-full rounded-xl object-cover sm:w-44"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 text-xs font-medium text-teal-800">
                        <CheckCircle2 className="size-3.5" />
                        Foto siap dianalisis
                      </p>
                      <p className="mt-1 truncate text-[11px] text-slate-500">
                        {fotoName || "foto-kristal.jpg"}
                      </p>
                      <p className="mt-1 text-[10px] leading-4 text-slate-400">
                        AI simulasi membaca sinyal warna dan pola butiran dari
                        citra ini.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-700 transition hover:bg-slate-50">
                          <Upload className="size-3" />
                          Ganti foto
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={(event) =>
                              handleFile(event.target.files?.[0])
                            }
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setFoto(undefined);
                            setFotoName("");
                            if (fileInputRef.current)
                              fileInputRef.current.value = "";
                          }}
                          className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-white px-3 py-1.5 text-[11px] font-medium text-rose-600 transition hover:bg-rose-50"
                        >
                          <X className="size-3" />
                          Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <label className="flex cursor-pointer flex-col items-center justify-center gap-2 py-5 text-center">
                    <span className="flex size-11 items-center justify-center rounded-full bg-white text-teal-700 shadow-sm ring-1 ring-slate-200">
                      {fotoLoading ? (
                        <LoaderCircle className="size-5 animate-spin" />
                      ) : (
                        <Camera className="size-5" />
                      )}
                    </span>
                    <span className="text-sm font-medium text-slate-800">
                      {fotoLoading
                        ? "Memproses foto…"
                        : "Unggah foto kristal garam"}
                    </span>
                    <span className="max-w-sm text-[11px] leading-5 text-slate-500">
                      JPG, PNG, atau WEBP. Foto opsional untuk demo, tetapi
                      sangat disarankan agar sinyal AI lebih kaya.
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(event) =>
                        handleFile(event.target.files?.[0])
                      }
                    />
                  </label>
                )}
              </div>
            </SectionStep>

            <div className="rounded-2xl border border-teal-100 bg-teal-50/50 p-4">
              <div className="flex items-start gap-2.5">
                <Lock className="mt-0.5 size-4 shrink-0 text-teal-700" />
                <p className="text-[11px] leading-5 text-teal-900/80">
                  Data baru masuk <strong>antrean verifikator</strong>. Catatan
                  blockchain hanya dibuat setelah komunitas menandatangani
                  pengesahan.
                </p>
              </div>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-[11px] text-slate-600">
                  {wallet.connected && wallet.address ? (
                    <>
                      <span className="flex size-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                        <Wallet className="size-3" />
                      </span>
                      <span>
                        {wallet.source === "phantom" ? "Phantom" : "Demo"} ·{" "}
                        <span className="font-mono">
                          {shortAddress(wallet.address, 5)}
                        </span>
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="flex size-6 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                        <Wallet className="size-3" />
                      </span>
                      <span>Belum terhubung — wallet demo akan dipakai.</span>
                      <button
                        type="button"
                        onClick={() => void onConnect()}
                        className="font-semibold text-teal-700 underline-offset-2 hover:underline"
                      >
                        Connect
                      </button>
                    </>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={analyzing || fotoLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-800 to-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-900/15 transition hover:from-teal-900 hover:to-emerald-800 disabled:cursor-wait disabled:opacity-70"
                >
                  {analyzing ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Sparkles className="size-4" />
                  )}
                  {analyzing
                    ? "Menganalisis batch…"
                    : revisiId
                      ? "Analisis Ulang & Ajukan Revisi"
                      : "Analisis dengan AI & Ajukan Verifikasi"}
                </button>
              </div>
            </div>
          </form>
        </div>

        <aside id="panel-analisis-ai" className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          {analyzing ? (
            <div className="overflow-hidden rounded-3xl border border-teal-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex size-8 items-center justify-center rounded-xl bg-teal-900 text-white">
                    <Sparkles className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Menganalisis…
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Simulasi AI lokal
                    </p>
                  </div>
                </div>
                <span className="font-mono text-[11px] text-teal-700">
                  {Math.min(99, (stage + 1) * 25)}%
                </span>
              </div>
              <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-teal-600 to-emerald-500 transition-all duration-500"
                  style={{ width: `${Math.min(99, (stage + 1) * 25)}%` }}
                />
              </div>
              <div className="mt-5 space-y-3">
                {analysisStages.map((label, index) => {
                  const done = index < stage;
                  const active = index === stage;
                  return (
                    <div
                      key={label}
                      className={cn(
                        "flex items-center gap-2.5 text-xs transition",
                        done
                          ? "text-emerald-700"
                          : active
                            ? "text-slate-900"
                            : "text-slate-400",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-5 shrink-0 items-center justify-center rounded-full",
                          done
                            ? "bg-emerald-100 text-emerald-700"
                            : active
                              ? "bg-teal-100 text-teal-700"
                              : "bg-slate-100 text-slate-400",
                        )}
                      >
                        {done ? (
                          <CheckCircle2 className="size-3" />
                        ) : active ? (
                          <LoaderCircle className="size-3 animate-spin" />
                        ) : (
                          <span className="size-1.5 rounded-full bg-current" />
                        )}
                      </span>
                      {label}
                    </div>
                  );
                })}
              </div>
              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[10px] leading-5 text-amber-800">
                Hasil AI hanya indikasi awal. Pengesahan tetap dilakukan
                komunitas.
              </div>
            </div>
          ) : result ? (
            <div className="animate-fade-up overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-2">
                  <span className="flex size-8 items-center justify-center rounded-xl bg-teal-900 text-white">
                    <Sparkles className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Hasil Analisis AI
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {result.model}
                    </p>
                  </div>
                </div>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide text-slate-500">
                  Simulasi
                </span>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-4">
                  <ScoreRing score={result.skor} size={92} />
                  <div className="min-w-0">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Indikasi Awal
                    </p>
                    <p
                      className={cn(
                        "mt-1 text-sm font-semibold leading-5",
                        sesuai ? "text-emerald-700" : "text-rose-700",
                      )}
                    >
                      {result.status}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-400">
                      {formatDateTime(result.dianalisisPada)}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-400">
                      Sinyal citra: {result.subSkor.citra}/100
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-xs leading-5 text-slate-600">
                  {result.ringkasan}
                </p>

                <div className="mt-4 space-y-2.5">
                  {[
                    { label: "Warna", value: result.subSkor.warna, bobot: "15%" },
                    {
                      label: "Tekstur",
                      value: result.subSkor.tekstur,
                      bobot: "20%",
                    },
                    {
                      label: "Kadar air",
                      value: result.subSkor.kadarAir,
                      bobot: "20%",
                    },
                    {
                      label: "Salinitas",
                      value: result.subSkor.salinitas,
                      bobot: "25%",
                    },
                    {
                      label: "Dokumen",
                      value: result.subSkor.dokumen,
                      bobot: "20%",
                    },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-medium text-slate-600">
                          {item.label}
                          <span className="ml-1 text-slate-400">
                            ({item.bobot})
                          </span>
                        </span>
                        <span className="font-mono text-slate-500">
                          {item.value}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-700",
                            item.value >= 75
                              ? "bg-emerald-500"
                              : item.value >= 60
                                ? "bg-amber-500"
                                : "bg-rose-500",
                          )}
                          style={{ width: `${item.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {result.faktorRisiko.length > 0 ? (
                  <ul className="mt-4 space-y-2 rounded-xl border border-amber-100 bg-amber-50/60 p-3">
                    {result.faktorRisiko.map((factor) => (
                      <li
                        key={factor}
                        className="flex items-start gap-1.5 text-[10px] leading-4 text-amber-800"
                      >
                        <AlertTriangle className="mt-0.5 size-3 shrink-0" />
                        {factor}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 flex items-start gap-1.5 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 text-[10px] leading-4 text-emerald-800">
                    <CheckCircle2 className="mt-0.5 size-3 shrink-0" />
                    Tidak ada sinyal risiko utama dari parameter yang diisi.
                  </p>
                )}

                <p className="mt-3 rounded-xl bg-slate-50 p-3 text-[10px] leading-4 text-slate-500">
                  {result.disclaimer}
                </p>
              </div>

              {submitted ? (
                <div className="border-t border-emerald-100 bg-emerald-50/70 p-5">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                    <div>
                      <p className="text-xs font-semibold text-emerald-900">
                        Batch diajukan — menunggu pengesahan
                      </p>
                      <p className="mt-0.5 font-mono text-[10px] text-emerald-700">
                        {submitted.id}
                      </p>
                      <p className="mt-1 text-[10px] leading-4 text-emerald-800/80">
                        Belum tercatat on-chain. Verifikator komunitas akan
                        memeriksa data dan menandatangani pengesahan.
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={onViewQueue}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-teal-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-teal-800"
                    >
                      Lihat antrean verifikator
                      <ArrowRight className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-xs font-medium text-emerald-800 transition hover:bg-emerald-50"
                    >
                      Input batch baru
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-teal-50/80 via-white to-emerald-50/50 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex size-8 items-center justify-center rounded-xl bg-teal-900 text-white">
                    <Sparkles className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Analisis AI
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Indikasi awal, bukan vonis
                    </p>
                  </div>
                </div>
                <span className="rounded-full border border-teal-200 bg-white/80 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide text-teal-700">
                  Simulasi
                </span>
              </div>

              <div className="mt-4 flex flex-col items-center justify-center rounded-2xl border border-dashed border-teal-200 bg-white/70 px-4 py-8 text-center">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-teal-900 text-white shadow-lg shadow-teal-900/20">
                  <ScanLine className="size-5" />
                </span>
                <p className="mt-3 text-sm font-medium text-slate-800">
                  Belum ada batch dianalisis
                </p>
                <p className="mt-1 max-w-[220px] text-[11px] leading-4 text-slate-500">
                  Lengkapi form dan unggah foto, lalu jalankan analisis AI.
                </p>
              </div>

              <ul className="mt-4 space-y-2.5">
                {AMBANG_5_INDIKATOR.slice(0, 3).map((item) => (
                  <li
                    key={item.kunci}
                    className="flex items-start gap-2 text-[11px] text-slate-600"
                  >
                    <ChevronRight className="mt-0.5 size-3 shrink-0 text-teal-600" />
                    <span>
                      <span className="font-medium text-slate-800">
                        {item.label}
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        {item.jenis}
                      </span>
                    </span>
                  </li>
                ))}
                <li className="flex items-start gap-2 text-[11px] text-slate-600">
                  <ChevronRight className="mt-0.5 size-3 shrink-0 text-teal-600" />
                  <span>
                    <span className="font-medium text-slate-800">
                      Dokumen & parameter ukur
                    </span>
                    <span className="block text-[10px] text-slate-400">
                      Kadar air, salinitas, surat kelompok
                    </span>
                  </span>
                </li>
              </ul>

              <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[10px] leading-4 text-amber-800">
                Hasil AI hanya indikasi awal dan memerlukan pengesahan komunitas
                sebelum dicatat ke blockchain.
              </p>
            </div>
          )}

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-teal-700" />
              <h3 className="text-sm font-semibold text-slate-900">
                Alur Pengesahan
              </h3>
            </div>
            <ol className="mt-4 space-y-3">
              {[
                {
                  icon: FileText,
                  title: "Input & analisis AI",
                  desc: "Data batch dan 5 indikator diperiksa otomatis.",
                },
                {
                  icon: Users,
                  title: "Antrean komunitas",
                  desc: "Verifikator meninjau bukti dan hasil AI.",
                },
                {
                  icon: Wallet,
                  title: "Tanda tangan Phantom",
                  desc: "Pengesahan ditandatangani wallet verifikator.",
                },
                {
                  icon: Blocks,
                  title: "Catatan blockchain",
                  desc: "Hash rekaman dan pengesah dicatat permanen.",
                },
              ].map((step, index) => {
                const Icon = step.icon;
                const active = submitted ? index === 1 : index === 0;
                const done = submitted ? index === 0 : false;
                return (
                  <li key={step.title} className="flex gap-2.5">
                    <span
                      className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ring-1 ring-inset",
                        done
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-600/15"
                          : active
                            ? "bg-teal-900 text-white ring-teal-900"
                            : "bg-slate-50 text-slate-400 ring-slate-200",
                      )}
                    >
                      {done ? (
                        <CheckCircle2 className="size-3.5" />
                      ) : (
                        <Icon className="size-3.5" />
                      )}
                    </span>
                    <div className="pt-0.5">
                      <p
                        className={cn(
                          "text-[11px] font-medium",
                          active || done
                            ? "text-slate-800"
                            : "text-slate-500",
                        )}
                      >
                        {step.title}
                      </p>
                      <p className="mt-0.5 text-[10px] leading-4 text-slate-400">
                        {step.desc}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </aside>
      </div>

      <TutorialDokumen onUseExample={gunakanContohDokumen} />

      <section className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">
              Batch Garam Terbaru
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Termasuk data demo yang sudah tersedia untuk presentasi.
            </p>
          </div>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-500">
            {batches.length} batch
          </span>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {daftarBatch.map((batch) => (
            <div
              key={batch.id}
              className="group flex min-w-0 flex-col rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-mono text-[10px] text-slate-400">
                    {batch.id}
                  </p>
                  <p className="mt-1 truncate text-sm font-semibold text-slate-900">
                    {batch.namaTambak}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-slate-500">
                    <MapPin className="size-3 shrink-0" />
                    {batch.lokasi}
                  </p>
                </div>
                <StatusBadge status={batch.status} size="sm" />
              </div>

              <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Sparkles className="size-3 text-teal-600" />
                  {batch.ai.skor}/100
                </span>
                <span className="text-slate-300">·</span>
                <span>{formatDateTime(batch.dibuatPada)}</span>
              </div>

              {batch.status === "SENGKETA" && batch.alasanSengketa ? (
                <p className="mt-2 line-clamp-2 rounded-lg bg-rose-50 p-2 text-[10px] leading-4 text-rose-700">
                  {batch.alasanSengketa}
                </p>
              ) : null}

              <div className="mt-auto pt-3">
                {batch.status === "TERVERIFIKASI" ? (
                  <button
                    type="button"
                    onClick={() => onViewCertificate(batch.id)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 transition group-hover:gap-2"
                  >
                    Lihat sertifikat
                    <ArrowRight className="size-3" />
                  </button>
                ) : batch.status === "MENUNGGU_PENGESAHAN" ? (
                  <button
                    type="button"
                    onClick={onViewQueue}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 transition group-hover:gap-2"
                  >
                    Lihat antrean verifikator
                    <ArrowRight className="size-3" />
                  </button>
                ) : batch.status === "SENGKETA" ? (
                  <button
                    type="button"
                    onClick={() => mulaiRevisi(batch)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 transition group-hover:gap-2"
                  >
                    Perbaiki &amp; ajukan ulang
                    <ArrowRight className="size-3" />
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                    <CircleAlert className="size-3" />
                    Ditolak — hubungi komunitas
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
