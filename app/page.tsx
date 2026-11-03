"use client";

import {
  ArrowRight,
  BadgeCheck,
  Blocks,
  CheckCircle2,
  Lock,
  QrCode,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Sprout,
  Users,
  Wallet,
  Waves,
} from "lucide-react";
import type { ComponentType } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Header } from "@/components/Header";
import { TabKonsumen } from "@/components/TabKonsumen";
import { TabPetambak } from "@/components/TabPetambak";
import { TabVerifikator } from "@/components/TabVerifikator";
import { ToastStack } from "@/components/ToastStack";
import {
  connectPhantom,
  disconnectPhantom,
  getPhantomProvider,
  walletDariProvider,
} from "@/lib/blockchain";
import { DEMO_WALLETS, STORAGE_KEY } from "@/lib/constants";
import { DUMMY_BATCHES } from "@/lib/dummy";
import type {
  BatchGaram,
  BlockchainProof,
  Role,
  TabId,
  ToastMessage,
  ToastType,
  WalletState,
} from "@/lib/types";
import { cn, delay, shortAddress } from "@/lib/utils";

const emptyWallet: WalletState = {
  connected: false,
  address: null,
  source: null,
};

function isBatchGaram(value: unknown): value is BatchGaram {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.namaTambak === "string" &&
    typeof record.status === "string" &&
    typeof record.ai === "object" &&
    record.ai !== null
  );
}

const tabMeta: {
  id: TabId;
  role: Role;
  label: string;
  shortLabel: string;
  icon: ComponentType<{ className?: string }>;
}[] = [
  {
    id: "petambak",
    role: "produsen",
    label: "Dashboard Petambak",
    shortLabel: "Petambak",
    icon: Sprout,
  },
  {
    id: "verifikator",
    role: "verifikator",
    label: "Verifikator Komunitas",
    shortLabel: "Verifikator",
    icon: ShieldCheck,
  },
  {
    id: "konsumen",
    role: "konsumen",
    label: "Pelacakan Konsumen",
    shortLabel: "Konsumen",
    icon: QrCode,
  },
];

const alur = [
  {
    icon: Sprout,
    title: "Input batch",
    desc: "Petambak mencatat asal, panen, dan 5 indikator.",
  },
  {
    icon: Sparkles,
    title: "Indikasi AI",
    desc: "Citra dan parameter dinilai sebagai peringatan awal.",
  },
  {
    icon: ShieldCheck,
    title: "Pengesahan komunitas",
    desc: "Verifikator memeriksa lalu menandatangani.",
  },
  {
    icon: Blocks,
    title: "Catatan blockchain",
    desc: "Hash rekaman dan identitas pengesah menjadi bukti.",
  },
];

export default function Home() {
  const [batches, setBatches] = useState<BatchGaram[]>(DUMMY_BATCHES);
  const [role, setRole] = useState<Role>("produsen");
  const [activeTab, setActiveTab] = useState<TabId>("petambak");
  const [wallet, setWallet] = useState<WalletState>(emptyWallet);
  const [connecting, setConnecting] = useState(false);
  const [traceQuery, setTraceQuery] = useState("");
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [phantomReady, setPhantomReady] = useState(false);
  const toastId = useRef(0);
  const connectingRef = useRef(false);

  const addToast = useCallback(
    (type: ToastType, title: string, description?: string) => {
      toastId.current += 1;
      const id = toastId.current;
      setToasts((prev) => [
        ...prev.slice(-1),
        { id, type, title, description },
      ]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, 5200);
    },
    [],
  );

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as unknown;
        if (Array.isArray(parsed)) {
          const valid = parsed.filter(isBatchGaram).map((batch) => ({
            ...batch,
            ai: {
              ...batch.ai,
              faktorRisiko: Array.isArray(batch.ai.faktorRisiko)
                ? batch.ai.faktorRisiko
                : [],
            },
            distribusi: Array.isArray(batch.distribusi)
              ? batch.distribusi
              : [],
          }));
          // eslint-disable-next-line react-hooks/set-state-in-effect -- hidrasi data demo dari localStorage setelah mount
          if (valid.length > 0) setBatches(valid);
        }
      }
    } catch {
      // Data lokal rusak / tidak tersedia: gunakan data demo.
    }

    const params = new URLSearchParams(window.location.search);
    const batchParam = params.get("batch");
    const tabParam = params.get("tab");
    if (batchParam) {
      setTraceQuery(batchParam);
      setRole("konsumen");
      setActiveTab("konsumen");
    } else if (
      tabParam === "petambak" ||
      tabParam === "verifikator" ||
      tabParam === "konsumen"
    ) {
      setActiveTab(tabParam);
      setRole(
        tabParam === "petambak"
          ? "produsen"
          : tabParam === "verifikator"
            ? "verifikator"
            : "konsumen",
      );
    }

    const provider = getPhantomProvider();
    if (provider) {
      setPhantomReady(true);
      if (provider.isConnected && provider.publicKey) {
        setWallet(walletDariProvider(provider));
      }
    }

    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(batches));
    } catch {
      // Kuota localStorage bisa penuh jika foto terlalu besar; abaikan.
    }
  }, [batches, hydrated]);

  const handleConnect = useCallback(async (): Promise<WalletState | null> => {
    if (connectingRef.current) return null;
    connectingRef.current = true;
    setConnecting(true);

    try {
      const provider = getPhantomProvider();
      if (provider) {
        const { address } = await connectPhantom();
        const next: WalletState = {
          connected: true,
          address,
          source: "phantom",
        };
        setWallet(next);
        setPhantomReady(true);
        addToast(
          "success",
          "Phantom terhubung",
          `Wallet ${shortAddress(address, 6)} siap digunakan.`,
        );
        return next;
      }

      await delay(450);
      const address =
        role === "verifikator"
          ? DEMO_WALLETS.verifikator
          : DEMO_WALLETS.petambak;
      const next: WalletState = {
        connected: true,
        address,
        source: "demo",
      };
      setWallet(next);
      addToast(
        "info",
        "Phantom tidak terdeteksi",
        "Mode demo aktif: wallet simulasi dipakai agar alur presentasi tetap berjalan.",
      );
      return next;
    } catch (error) {
      const detail =
        typeof error === "object" && error !== null
          ? (error as { code?: number; message?: string })
          : {};
      const rejected =
        detail.code === 4001 ||
        /reject|denied|dibatalkan/i.test(detail.message ?? "");
      addToast(
        "error",
        rejected ? "Koneksi dibatalkan" : "Gagal menghubungkan Phantom",
        rejected
          ? "Izin koneksi ditolak. Coba lagi saat siap."
          : "Pastikan ekstensi Phantom aktif lalu coba lagi.",
      );
      return null;
    } finally {
      connectingRef.current = false;
      setConnecting(false);
    }
  }, [addToast, role]);

  const handleDisconnect = useCallback(async () => {
    if (wallet.source === "phantom") {
      await disconnectPhantom();
    }
    setWallet(emptyWallet);
    addToast("info", "Wallet terputus", "Sesi wallet di halaman ini telah diakhiri.");
  }, [addToast, wallet.source]);

  const syncDemoWallet = useCallback((next: Role) => {
    setWallet((prev) =>
      prev.source === "demo"
        ? {
            ...prev,
            address:
              next === "verifikator"
                ? DEMO_WALLETS.verifikator
                : DEMO_WALLETS.petambak,
          }
        : prev,
    );
  }, []);

  const handleRoleChange = useCallback(
    (next: Role) => {
      setRole(next);
      setActiveTab(
        next === "produsen"
          ? "petambak"
          : next === "verifikator"
            ? "verifikator"
            : "konsumen",
      );
      syncDemoWallet(next);
    },
    [syncDemoWallet],
  );

  const handleTabChange = useCallback(
    (tab: TabId) => {
      setActiveTab(tab);
      const nextRole: Role =
        tab === "petambak"
          ? "produsen"
          : tab === "verifikator"
            ? "verifikator"
            : "konsumen";
      setRole(nextRole);
      syncDemoWallet(nextRole);
    },
    [syncDemoWallet],
  );

  const handleSubmitBatch = useCallback((batch: BatchGaram) => {
    setBatches((prev) => [batch, ...prev.filter((item) => item.id !== batch.id)]);
  }, []);

  const handleApprove = useCallback(
    (batchId: string, proof: BlockchainProof) => {
      const now = new Date().toISOString();
      setBatches((prev) =>
        prev.map((batch) =>
          batch.id === batchId
            ? {
                ...batch,
                status: "TERVERIFIKASI",
                blockchain: proof,
                alasanSengketa: undefined,
                catatanVerifikator: undefined,
                diperbaruiPada: now,
              }
            : batch,
        ),
      );
    },
    [],
  );

  const handleDispute = useCallback((batchId: string, reason: string) => {
    const now = new Date().toISOString();
    setBatches((prev) =>
      prev.map((batch) =>
        batch.id === batchId
          ? {
              ...batch,
              status: "SENGKETA",
              alasanSengketa: reason,
              catatanVerifikator:
                "Menunggu klarifikasi dan perbaikan data dari produsen.",
              diperbaruiPada: now,
            }
          : batch,
      ),
    );
  }, []);

  const handleViewQueue = useCallback(() => {
    setRole("verifikator");
    setActiveTab("verifikator");
    syncDemoWallet("verifikator");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [syncDemoWallet]);

  const handleViewCertificate = useCallback((batchId: string) => {
    setTraceQuery(batchId);
    setRole("konsumen");
    setActiveTab("konsumen");
    window.setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 80);
  }, []);

  const handleTraceQueryChange = useCallback((value: string) => {
    setTraceQuery(value);
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (value.trim()) url.searchParams.set("batch", value.trim());
    else url.searchParams.delete("batch");
    url.searchParams.set("tab", "konsumen");
    window.history.replaceState(
      null,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }, []);

  const handleCopy = useCallback(
    async (value: string, label: string) => {
      try {
        await navigator.clipboard.writeText(value);
        addToast("success", "Disalin", `${label} disalin ke clipboard.`);
      } catch {
        try {
          const area = document.createElement("textarea");
          area.value = value;
          area.style.position = "fixed";
          area.style.opacity = "0";
          document.body.appendChild(area);
          area.select();
          document.execCommand("copy");
          document.body.removeChild(area);
          addToast("success", "Disalin", `${label} disalin ke clipboard.`);
        } catch {
          addToast(
            "error",
            "Gagal menyalin",
            "Browser memblokir akses clipboard. Salin manual dari teks yang tersedia.",
          );
        }
      }
    },
    [addToast],
  );

  const menunggu = batches.filter(
    (batch) => batch.status === "MENUNGGU_PENGESAHAN",
  ).length;
  const terverifikasi = batches.filter(
    (batch) => batch.status === "TERVERIFIKASI",
  ).length;
  const sengketa = batches.filter(
    (batch) => batch.status === "SENGKETA",
  ).length;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#f4f7f5] text-slate-900">
      <div className="no-print pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-40 right-0 size-[480px] rounded-full bg-emerald-200/30 blur-3xl" />
        <div className="absolute bottom-0 left-0 size-[420px] rounded-full bg-teal-200/25 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 size-[320px] rounded-full bg-amber-100/30 blur-3xl" />
      </div>

      <Header
        role={role}
        onRoleChange={handleRoleChange}
        wallet={wallet}
        onConnect={() => void handleConnect()}
        onDisconnect={() => void handleDisconnect()}
        connecting={connecting}
      />

      <main className="mx-auto w-full max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        {activeTab === "petambak" ? (
        <section className="no-print relative overflow-hidden rounded-[30px] border border-slate-200/70 bg-white px-6 py-8 shadow-sm sm:px-8 sm:py-9 lg:px-10">
          <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-teal-100/60 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 right-1/3 size-72 rounded-full bg-amber-100/50 blur-3xl" />
          <div className="relative grid gap-8 lg:grid-cols-[1.4fr_0.6fr] lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-teal-700">
                  <Sparkles className="size-3" />
                  Prototipe UTS
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-slate-500">
                  Garam Lokal · AI · Blockchain
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-medium",
                    phantomReady
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-amber-200 bg-amber-50 text-amber-700",
                  )}
                >
                  <Wallet className="size-3" />
                  {phantomReady ? "Phantom terdeteksi" : "Mode demo wallet"}
                </span>
              </div>

              <h1 className="mt-4 max-w-2xl text-3xl font-semibold leading-[1.12] tracking-tight text-slate-900 sm:text-4xl">
                Keaslian garam lokal,{" "}
                <span className="bg-gradient-to-r from-teal-700 via-emerald-600 to-teal-500 bg-clip-text text-transparent">
                  dari tambak sampai meja.
                </span>
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                GaramTrace memadukan pengetahuan lokal, indikasi awal AI,
                pengesahan komunitas, dan catatan blockchain. Data baru masuk
                on-chain hanya setelah verifikator menandatangani pengesahan.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {[
                  "5 indikator komunitas",
                  "AI indikasi awal",
                  "Pengesahan verifikator",
                  "QR traceability",
                ].map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-medium text-slate-600"
                  >
                    <CheckCircle2 className="size-3 text-emerald-500" />
                    {item}
                  </span>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={() => handleRoleChange("produsen")}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-teal-900"
                >
                  Mulai input batch
                  <ArrowRight className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleChange("konsumen")}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <ScanLine className="size-3.5" />
                  Lacak produk
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200/80 bg-slate-50/70 p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-800">
                  Ringkasan demo
                </p>
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[9px] font-medium text-emerald-700 ring-1 ring-emerald-200">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  live
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2.5">
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-xl font-semibold leading-none text-slate-900">
                    {batches.length}
                  </p>
                  <p className="mt-1 text-[9px] uppercase tracking-wider text-slate-400">
                    Total batch
                  </p>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3">
                  <p className="text-xl font-semibold leading-none text-emerald-700">
                    {terverifikasi}
                  </p>
                  <p className="mt-1 text-[9px] uppercase tracking-wider text-emerald-600/70">
                    Terverifikasi
                  </p>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3">
                  <p className="text-xl font-semibold leading-none text-amber-700">
                    {menunggu}
                  </p>
                  <p className="mt-1 text-[9px] uppercase tracking-wider text-amber-600/70">
                    Menunggu
                  </p>
                </div>
                <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3">
                  <p className="text-xl font-semibold leading-none text-rose-700">
                    {sengketa}
                  </p>
                  <p className="mt-1 text-[9px] uppercase tracking-wider text-rose-600/70">
                    Sengketa
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[9px] font-medium text-slate-500">
                <span>Input</span>
                <ArrowRight className="size-3 text-slate-300" />
                <span>AI</span>
                <ArrowRight className="size-3 text-slate-300" />
                <span>Komunitas</span>
                <ArrowRight className="size-3 text-slate-300" />
                <span className="text-teal-700">On-chain</span>
              </div>
            </div>
          </div>

          <div className="relative mt-8 grid gap-2 border-t border-slate-100 pt-5 sm:grid-cols-2 lg:grid-cols-4">
            {alur.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.title}
                  className="flex items-start gap-2.5 rounded-xl px-2 py-1.5"
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white">
                    <Icon className="size-3.5" />
                  </span>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-800">
                      <span className="mr-1 text-slate-400">0{index + 1}</span>
                      {step.title}
                    </p>
                    <p className="mt-0.5 text-[10px] leading-4 text-slate-500">
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
        ) : null}

        <div className="no-print mt-5 flex flex-col gap-2 rounded-2xl border border-slate-200/80 bg-white/90 p-1.5 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div
            role="tablist"
            aria-label="Pilih dashboard"
            className="flex gap-1 overflow-x-auto"
          >
            {tabMeta.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              const count =
                tab.id === "verifikator"
                  ? menunggu
                  : tab.id === "konsumen"
                    ? terverifikasi
                    : undefined;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-2.5 text-[10px] font-medium transition sm:gap-2 sm:px-4 sm:text-[11px]",
                    active
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-3.5 sm:size-4",
                      active ? "text-emerald-300" : "text-slate-400",
                    )}
                  />
                  <span className="sm:hidden">{tab.shortLabel}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                  {count !== undefined ? (
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[9px] font-semibold",
                        active
                          ? "bg-white/15 text-white"
                          : tab.id === "verifikator"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700",
                      )}
                    >
                      {count}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
          <div className="hidden items-center gap-1.5 px-3 text-[10px] text-slate-400 sm:flex">
            <Lock className="size-3" />
            {hydrated
              ? "Data demo tersimpan di browser"
              : "Memuat data demo…"}
          </div>
        </div>

        <div className="mt-5">
          {activeTab === "petambak" ? (
            <TabPetambak
              batches={batches}
              wallet={wallet}
              onConnect={handleConnect}
              onSubmit={handleSubmitBatch}
              onViewQueue={handleViewQueue}
              onViewCertificate={handleViewCertificate}
              addToast={addToast}
            />
          ) : activeTab === "verifikator" ? (
            <TabVerifikator
              batches={batches}
              wallet={wallet}
              onConnect={handleConnect}
              onApprove={handleApprove}
              onDispute={handleDispute}
              onViewCertificate={handleViewCertificate}
              onCopy={handleCopy}
              addToast={addToast}
            />
          ) : (
            <TabKonsumen
              batches={batches}
              query={traceQuery}
              onQueryChange={handleTraceQueryChange}
              onCopy={handleCopy}
              addToast={addToast}
            />
          )}
        </div>

        <footer className="no-print mt-10 border-t border-slate-200/70 pt-6">
          <div className="flex flex-col gap-3 text-[10px] text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <p>
              GaramTrace · Prototipe UTS Keamanan Data &amp; Blockchain ·
              Pengetahuan lokal, AI, dan Solana.
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
              <span className="inline-flex items-center gap-1">
                <Waves className="size-3" />
                Garam lokal
              </span>
              <span className="inline-flex items-center gap-1">
                <Users className="size-3" />
                Pengesahan komunitas
              </span>
              <span className="inline-flex items-center gap-1">
                <BadgeCheck className="size-3" />
                AI indikasi awal
              </span>
              <span className="inline-flex items-center gap-1">
                <Blocks className="size-3" />
                Solana Devnet · memo
              </span>
            </div>
          </div>
        </footer>
      </main>

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
