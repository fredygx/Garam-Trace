"use client";

import {
  LoaderCircle,
  LogOut,
  ShieldCheck,
  Sprout,
  Users,
  Wallet,
  Waves,
} from "lucide-react";
import type { ComponentType } from "react";
import { LABEL_ROLE } from "@/lib/constants";
import type { Role, WalletState } from "@/lib/types";
import { cn, shortAddress } from "@/lib/utils";

const roleOptions: {
  id: Role;
  icon: ComponentType<{ className?: string }>;
  hint: string;
}[] = [
  { id: "produsen", icon: Sprout, hint: "Input batch" },
  { id: "verifikator", icon: ShieldCheck, hint: "Sahkan data" },
  { id: "konsumen", icon: Users, hint: "Lacak produk" },
];

export function Header({
  role,
  onRoleChange,
  wallet,
  onConnect,
  onDisconnect,
  connecting,
}: {
  role: Role;
  onRoleChange: (role: Role) => void;
  wallet: WalletState;
  onConnect: () => void;
  onDisconnect: () => void;
  connecting: boolean;
}) {
  return (
    <header className="no-print sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-900 to-emerald-600 text-white shadow-lg shadow-teal-900/20">
              <Waves className="size-5" />
              <span className="absolute -right-1 -top-1 size-2.5 rounded-full bg-amber-400 ring-2 ring-white" />
            </div>
            <div>
              <p className="text-base font-semibold leading-none tracking-tight text-slate-900">
                GaramTrace
              </p>
              <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">
                Verifikasi Garam Lokal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <WalletButton
              wallet={wallet}
              onConnect={onConnect}
              onDisconnect={onDisconnect}
              connecting={connecting}
              compact
            />
          </div>
        </div>

        <div className="order-3 flex min-w-0 items-center gap-1 overflow-x-auto rounded-2xl bg-slate-100/80 p-1 lg:order-none lg:w-auto">
          {roleOptions.map((option) => {
            const Icon = option.icon;
            const active = role === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onRoleChange(option.id)}
                aria-pressed={active}
                className={cn(
                  "group flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition sm:px-4",
                  active
                    ? "bg-white text-teal-900 shadow-sm ring-1 ring-slate-200/80"
                    : "text-slate-500 hover:text-slate-800",
                )}
              >
                <Icon
                  className={cn(
                    "size-4",
                    active ? "text-teal-700" : "text-slate-400",
                  )}
                />
                <span className="flex flex-col items-start leading-none">
                  <span>{LABEL_ROLE[option.id]}</span>
                  <span
                    className={cn(
                      "mt-1 hidden text-[9px] font-normal tracking-wide sm:block",
                      active ? "text-teal-600/70" : "text-slate-400",
                    )}
                  >
                    {option.hint}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
              Jaringan
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-600">
              <span className="size-1.5 rounded-full bg-violet-500" />
              Solana Devnet
            </span>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <WalletButton
            wallet={wallet}
            onConnect={onConnect}
            onDisconnect={onDisconnect}
            connecting={connecting}
          />
        </div>
      </div>
    </header>
  );
}

function WalletButton({
  wallet,
  onConnect,
  onDisconnect,
  connecting,
  compact = false,
}: {
  wallet: WalletState;
  onConnect: () => void;
  onDisconnect: () => void;
  connecting: boolean;
  compact?: boolean;
}) {
  if (wallet.connected && wallet.address) {
    return (
      <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/70 py-1.5 pl-3 pr-1.5">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
        </span>
        <div className="min-w-0 leading-none">
          {!compact ? (
            <p className="text-[9px] font-medium uppercase tracking-wider text-emerald-700/70">
              {wallet.source === "phantom" ? "Phantom" : "Wallet demo"}
            </p>
          ) : null}
          <p className="font-mono text-[11px] font-medium text-emerald-900">
            {shortAddress(wallet.address, 4)}
          </p>
        </div>
        <button
          type="button"
          onClick={onDisconnect}
          className="rounded-full p-1.5 text-emerald-700/60 transition hover:bg-emerald-100 hover:text-emerald-900"
          aria-label="Putuskan wallet"
          title="Putuskan wallet"
        >
          <LogOut className="size-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onConnect}
      disabled={connecting}
      className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-teal-900 disabled:cursor-wait disabled:opacity-70"
    >
      {connecting ? (
        <LoaderCircle className="size-4 animate-spin" />
      ) : (
        <Wallet className="size-4" />
      )}
      {connecting ? (
        <>
          <span className="hidden sm:inline">Menghubungkan…</span>
          <span className="sm:hidden">Menghubungkan</span>
        </>
      ) : (
        <>
          <span className="hidden sm:inline">Connect Phantom</span>
          <span className="sm:hidden">Connect</span>
        </>
      )}
    </button>
  );
}
