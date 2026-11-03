import {
  Connection,
  PublicKey,
  SendTransactionError,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import bs58 from "bs58";
import {
  MEMO_PROGRAM_ID,
  PROGRAM_ID_SIMULASI,
  SOLANA_RPC_ENDPOINT,
  explorerTxUrl,
} from "./constants";
import type { BatchGaram, BlockchainProof, WalletState } from "./types";
import { base58Encode, hexToBytes, sha256Hex, stableStringify } from "./utils";

export interface PhantomProvider {
  isPhantom?: boolean;
  publicKey?: { toString(): string } | null;
  isConnected?: boolean;
  connect: (options?: {
    onlyIfTrusted?: boolean;
  }) => Promise<{ publicKey: { toString(): string } }>;
  disconnect: () => Promise<void>;
  signMessage: (
    message: Uint8Array,
    display?: "utf8" | "hex",
  ) => Promise<{ signature: Uint8Array; publicKey?: { toString(): string } }>;
  signTransaction?: (transaction: Transaction) => Promise<Transaction>;
  signAndSendTransaction?: (
    transaction: Transaction,
  ) => Promise<{ signature: string }>;
  request?: (args: { method: string; params?: unknown }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  off?: (event: string, handler: (...args: unknown[]) => void) => void;
}

declare global {
  interface Window {
    solana?: PhantomProvider;
    phantom?: { solana?: PhantomProvider };
  }
}

export function getPhantomProvider(): PhantomProvider | null {
  if (typeof window === "undefined") return null;
  const phantom = window.phantom?.solana;
  if (phantom?.isPhantom) return phantom;
  if (window.solana?.isPhantom) return window.solana;
  return window.solana ?? null;
}

export function phantomTersedia() {
  return getPhantomProvider() !== null;
}

export async function connectPhantom(): Promise<{
  address: string;
  provider: PhantomProvider;
}> {
  const provider = getPhantomProvider();
  if (!provider) {
    throw new Error("PHANTOM_NOT_FOUND");
  }
  const result = await provider.connect();
  return { address: result.publicKey.toString(), provider };
}

export async function disconnectPhantom() {
  const provider = getPhantomProvider();
  if (!provider) return;
  try {
    await provider.disconnect();
  } catch {
    // Ekstensi bisa menolak disconnect saat belum terhubung; abaikan.
  }
}

export function walletDariProvider(provider: PhantomProvider): WalletState {
  if (provider.publicKey) {
    return {
      connected: true,
      address: provider.publicKey.toString(),
      source: "phantom",
    };
  }
  return { connected: false, address: null, source: null };
}

export async function hashBatchRecord(batch: BatchGaram) {
  const fotoHash = batch.indikator.fotoKristalDataUrl
    ? await sha256Hex(batch.indikator.fotoKristalDataUrl)
    : null;

  const payload = {
    id: batch.id,
    namaTambak: batch.namaTambak,
    lokasi: batch.lokasi,
    tanggalPanen: batch.tanggalPanen,
    metodeProduksi: batch.metodeProduksi,
    indikator: {
      ...batch.indikator,
      fotoKristalDataUrl: fotoHash,
    },
    ai: {
      skor: batch.ai.skor,
      status: batch.ai.status,
      subSkor: batch.ai.subSkor,
      dianalisisPada: batch.ai.dianalisisPada,
      model: batch.ai.model,
    },
    distribusi: batch.distribusi,
  };

  return sha256Hex(stableStringify(payload));
}

export function susunPesanPengesahan(params: {
  batchId: string;
  recordHash: string;
  verifier: string;
  timestamp: string;
}) {
  return [
    "VERIFIKASI GARAM LOKAL — PENGESAHAN KOMUNITAS",
    `Batch       : ${params.batchId}`,
    `Record Hash : ${params.recordHash}`,
    `Verifikator : ${params.verifier}`,
    `Waktu       : ${params.timestamp}`,
    "Pesan ini menandakan persetujuan terhadap data yang tercatat.",
  ].join("\n");
}

const koneksiDevnet = new Connection(SOLANA_RPC_ENDPOINT, "confirmed");
const programMemo = new PublicKey(MEMO_PROGRAM_ID);

/**
 * Memo sengaja ringkas dan tanpa data pribadi: isi memo permanen dan publik di
 * explorer. Foto, nomor dokumen, dan nama kelompok tetap off-chain; hanya hash
 * rekaman yang ikut tercatat.
 */
export function susunMemoGaram(params: {
  batchId: string;
  recordHash: string;
  verifier: string;
  timestamp: string;
}) {
  return JSON.stringify({
    v: 1,
    app: "garam-trace",
    batch: params.batchId,
    hash: params.recordHash,
    actor: params.verifier,
    ts: params.timestamp,
  });
}

function pesanGalat(cause: unknown) {
  return cause instanceof Error ? cause.message : String(cause);
}

function adalahPenolakan(cause: unknown) {
  if (!cause || typeof cause !== "object") return false;
  if ((cause as { code?: unknown }).code === 4001) return true;
  const pesan = cause instanceof Error ? cause.message.toLowerCase() : "";
  return (
    pesan.includes("user rejected") ||
    pesan.includes("rejected the request") ||
    pesan.includes("dibatalkan")
  );
}

async function serialisasiTertandatangani(value: unknown) {
  if (value instanceof Uint8Array) return value;
  if (typeof value === "string") return bs58.decode(value);
  if (value && typeof value === "object" && "serialize" in value) {
    const serialize = (
      value as { serialize: () => Uint8Array | Promise<Uint8Array> }
    ).serialize;
    return await serialize.call(value);
  }
  throw new Error("Phantom tidak mengembalikan transaksi tertandatangani.");
}

/**
 * Ekstensi wallet tidak seragam: sebagian mendukung
 * `request({ method: "signTransaction" })`, sebagian hanya method objek.
 * Rantai fallback ini mengikuti urutan yang terbukti jalan di Phantom.
 */
async function kirimDenganPhantom(
  provider: PhantomProvider,
  connection: Connection,
  transaction: Transaction,
): Promise<string> {
  const galat: string[] = [];
  const pesanBase58 = bs58.encode(
    await transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    }),
  );

  if (provider.request) {
    let sudahKirim = false;
    try {
      const hasil = await provider.request({
        method: "signTransaction",
        params: { message: pesanBase58 },
      });
      const mentah = await serialisasiTertandatangani(hasil);
      sudahKirim = true;
      return await connection.sendRawTransaction(mentah, {
        skipPreflight: false,
      });
    } catch (cause) {
      if (adalahPenolakan(cause)) throw cause;
      if (sudahKirim) throw cause;
      galat.push(`signTransaction: ${pesanGalat(cause)}`);
    }

    try {
      const hasil = await provider.request({
        method: "signAndSendTransaction",
        params: { message: pesanBase58 },
      });
      const signature =
        typeof hasil === "string"
          ? hasil
          : (hasil as { signature?: unknown } | null)?.signature;
      if (typeof signature === "string" && signature.length > 0) {
        return signature;
      }
      galat.push("signAndSendTransaction: signature kosong");
    } catch (cause) {
      if (adalahPenolakan(cause)) throw cause;
      galat.push(`signAndSendTransaction: ${pesanGalat(cause)}`);
    }
  }

  if (provider.signTransaction) {
    let sudahKirim = false;
    try {
      const hasil = await provider.signTransaction(transaction);
      const mentah = await hasil.serialize();
      sudahKirim = true;
      return await connection.sendRawTransaction(mentah, {
        skipPreflight: false,
      });
    } catch (cause) {
      if (adalahPenolakan(cause)) throw cause;
      if (sudahKirim) throw cause;
      galat.push(`signTransaction: ${pesanGalat(cause)}`);
    }
  }

  if (provider.signAndSendTransaction) {
    try {
      const hasil = await provider.signAndSendTransaction(transaction);
      if (hasil.signature) return hasil.signature;
      galat.push("signAndSendTransaction: signature kosong");
    } catch (cause) {
      if (adalahPenolakan(cause)) throw cause;
      galat.push(`signAndSendTransaction: ${pesanGalat(cause)}`);
    }
  }

  throw new Error(
    galat.join(" | ") || "Wallet ini tidak mendukung pengiriman transaksi.",
  );
}

export interface BuktiMemoDevnet {
  signature: string;
  slot: number;
  blockTime: number;
  explorerUrl: string;
  memo: string;
  timestamp: string;
}

/**
 * Mengirim satu transaksi nyata ke Memo Program v2 di Solana Devnet.
 * Signature yang dikembalikan adalah signature transaksi, jadi bisa dibuka di
 * explorer. Biaya transaksi dibayar wallet verifikator (butuh SOL Devnet).
 */
export async function kirimMemoDevnet(params: {
  provider: PhantomProvider;
  batchId: string;
  recordHash: string;
  verifier: string;
}): Promise<BuktiMemoDevnet> {
  let payer: PublicKey;
  try {
    payer = new PublicKey(params.verifier);
  } catch {
    throw new Error("Alamat wallet verifikator tidak valid.");
  }

  const timestamp = new Date().toISOString();
  const memo = susunMemoGaram({
    batchId: params.batchId,
    recordHash: params.recordHash,
    verifier: params.verifier,
    timestamp,
  });

  const { blockhash, lastValidBlockHeight } = await koneksiDevnet.getLatestBlockhash(
    "confirmed",
  );
  const tinggiBlok = Number(lastValidBlockHeight);

  const transaction = new Transaction({
    feePayer: payer,
    blockhash,
    lastValidBlockHeight: tinggiBlok,
  });
  transaction.add(
    new TransactionInstruction({
      keys: [],
      programId: programMemo,
      data: new TextEncoder().encode(memo),
    }),
  );

  let signature: string;
  try {
    signature = await kirimDenganPhantom(params.provider, koneksiDevnet, transaction);
  } catch (cause) {
    if (adalahPenolakan(cause)) {
      throw new Error("Transaksi dibatalkan di Phantom.");
    }
    if (cause instanceof SendTransactionError) {
      let log = "";
      try {
        const detail = await cause.getLogs(koneksiDevnet);
        if (detail?.length) log = ` Log: ${detail.join(" | ")}`;
      } catch {
        // Log RPC opsional; pesan utama tetap ditampilkan.
      }
      throw new Error(`Transaksi memo ditolak Devnet. ${cause.message}${log}`);
    }
    throw new Error(
      `${pesanGalat(cause)}. Pastikan Phantom ada di jaringan Devnet dan punya SOL Devnet.`,
    );
  }

  let konfirmasi;
  try {
    konfirmasi = await koneksiDevnet.confirmTransaction(
      { signature, blockhash, lastValidBlockHeight: tinggiBlok },
      "confirmed",
    );
  } catch (cause) {
    throw new Error(
      `Transaksi terkirim tetapi konfirmasi gagal: ${pesanGalat(cause)}`,
    );
  }

  if (konfirmasi.value.err) {
    throw new Error(
      `Transaksi ditolak Devnet: ${JSON.stringify(konfirmasi.value.err)}`,
    );
  }

  let slot = Number(konfirmasi.context.slot);
  let blockTime = Math.floor(Date.now() / 1000);
  try {
    const info = await koneksiDevnet.getTransaction(signature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });
    if (info) {
      slot = Number(info.slot);
      if (info.blockTime) blockTime = Number(info.blockTime);
    }
  } catch {
    // Slot dari konfirmasi tetap dipakai kalau detail transaksi lambat.
  }

  return {
    signature,
    slot,
    blockTime,
    explorerUrl: explorerTxUrl(signature),
    memo,
    timestamp,
  };
}

export interface TandaTanganPengesahan {
  signature: string;
  timestamp: string;
  pesan: string;
  mode: "phantom" | "simulasi";
}

export async function tandaTanganPhantom(params: {
  provider: PhantomProvider;
  batchId: string;
  recordHash: string;
  verifier: string;
}): Promise<TandaTanganPengesahan> {
  const timestamp = new Date().toISOString();
  const pesan = susunPesanPengesahan({
    batchId: params.batchId,
    recordHash: params.recordHash,
    verifier: params.verifier,
    timestamp,
  });
  const encoded = new TextEncoder().encode(pesan);
  const result = await params.provider.signMessage(encoded, "utf8");
  return {
    signature: base58Encode(result.signature),
    timestamp,
    pesan,
    mode: "phantom",
  };
}

export async function tandaTanganSimulasi(params: {
  batchId: string;
  recordHash: string;
  verifier: string;
}): Promise<TandaTanganPengesahan> {
  const timestamp = new Date().toISOString();
  const pesan = susunPesanPengesahan({
    batchId: params.batchId,
    recordHash: params.recordHash,
    verifier: params.verifier,
    timestamp,
  });
  const seedA = hexToBytes(
    await sha256Hex(`${pesan}|${timestamp}|${Math.random()}`),
  );
  const seedB = hexToBytes(await sha256Hex(`${pesan}|nonce|${Math.random()}`));
  const signatureBytes = new Uint8Array(64);
  signatureBytes.set(seedA, 0);
  signatureBytes.set(seedB, 32);
  return {
    signature: base58Encode(signatureBytes),
    timestamp,
    pesan,
    mode: "simulasi",
  };
}

export function buatBuktiBlockchain(params: {
  tandaTangan: TandaTanganPengesahan;
  recordHash: string;
  walletPetambak: string;
  walletVerifikator: string;
  tx?: BuktiMemoDevnet;
}): BlockchainProof {
  if (params.tx) {
    return {
      network: "solana-devnet",
      txHash: params.tx.signature,
      slot: params.tx.slot,
      blockTime: params.tx.blockTime,
      explorerUrl: params.tx.explorerUrl,
      memo: params.tx.memo,
      recordHash: params.recordHash,
      walletPetambak: params.walletPetambak,
      walletVerifikator: params.walletVerifikator,
      disahkanPada: params.tx.timestamp,
      programId: MEMO_PROGRAM_ID,
      mode: "devnet",
    };
  }

  const slotSeed = Number.parseInt(params.recordHash.slice(0, 8), 16);
  const slot = 250_000_000 + (slotSeed % 50_000_000);
  return {
    network: "solana-devnet",
    txHash: params.tandaTangan.signature,
    slot,
    recordHash: params.recordHash,
    walletPetambak: params.walletPetambak,
    walletVerifikator: params.walletVerifikator,
    disahkanPada: params.tandaTangan.timestamp,
    programId: PROGRAM_ID_SIMULASI,
    mode: params.tandaTangan.mode,
  };
}
