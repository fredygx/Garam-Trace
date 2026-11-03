import type {
  BatchStatus,
  MetodeProduksi,
  Role,
  TahapDistribusi,
  TeksturButiran,
  WarnaKristal,
} from "./types";

export const STORAGE_KEY = "verifikasi-garam:batches:v1";

export const AMBANG_AI = 75;

export const BOBOT_AI = {
  warna: 0.15,
  tekstur: 0.2,
  kadarAir: 0.2,
  salinitas: 0.25,
  dokumen: 0.2,
} as const;

export const DISCLAIMER_AI =
  "Hasil AI hanya merupakan indikasi awal dan memerlukan pengesahan komunitas sebelum dicatat ke blockchain.";

export const DISCLAIMER_AI_TERVERIFIKASI =
  "Hasil AI adalah indikasi awal. Batch ini sudah disahkan komunitas; label Tinjau pada indikator tetap dicatat sebagai bahan pemantauan.";

export const MODEL_AI = "GaramVision v0.1 (simulasi rule-based)";

export const PROGRAM_ID_SIMULASI =
  "GaramVer1Demo111111111111111111111111111111";

export const SOLANA_CLUSTER = "devnet" as const;

export const SOLANA_RPC_ENDPOINT = "https://api.devnet.solana.com";

/** Memo Program v2 — instruksi tanpa account, cukup membawa teks memo. */
export const MEMO_PROGRAM_ID =
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr";

export function explorerTxUrl(signature: string) {
  return `https://explorer.solana.com/tx/${signature}?cluster=${SOLANA_CLUSTER}`;
}

export const DEMO_WALLETS = {
  petambak: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  verifikator: "B4nDk9pQm3sV7yH2cR5tL8wZ1xF6jN4uK1aE9dG3hS2m",
} as const;

export const LABEL_STATUS: Record<BatchStatus, string> = {
  MENUNGGU_PENGESAHAN: "Menunggu Pengesahan",
  TERVERIFIKASI: "Terverifikasi di Blockchain",
  SENGKETA: "Sengketa",
  DITOLAK: "Ditolak",
};

export const LABEL_STATUS_SINGKAT: Record<BatchStatus, string> = {
  MENUNGGU_PENGESAHAN: "Menunggu",
  TERVERIFIKASI: "Terverifikasi",
  SENGKETA: "Sengketa",
  DITOLAK: "Ditolak",
};

export const STATUS_STYLE: Record<BatchStatus, string> = {
  MENUNGGU_PENGESAHAN:
    "border-amber-200 bg-amber-50 text-amber-700 ring-amber-600/10",
  TERVERIFIKASI:
    "border-emerald-200 bg-emerald-50 text-emerald-700 ring-emerald-600/10",
  SENGKETA: "border-rose-200 bg-rose-50 text-rose-700 ring-rose-600/10",
  DITOLAK: "border-slate-200 bg-slate-100 text-slate-600 ring-slate-500/10",
};

export const STATUS_DOT: Record<BatchStatus, string> = {
  MENUNGGU_PENGESAHAN: "bg-amber-500",
  TERVERIFIKASI: "bg-emerald-500",
  SENGKETA: "bg-rose-500",
  DITOLAK: "bg-slate-400",
};

export const LABEL_METODE: Record<MetodeProduksi, string> = {
  kristalisasi_tradisional: "Kristalisasi Tradisional",
  meja_geomembran: "Meja Geomembran",
};

export const LABEL_WARNA: Record<WarnaKristal, string> = {
  putih_bersih: "Putih Bersih",
  putih_tulang: "Putih Tulang Alami",
};

export const LABEL_TEKSTUR: Record<TeksturButiran, string> = {
  kasar_krosok: "Kasar / Krosok",
  halus_merata: "Halus Merata",
};

export const LABEL_ROLE: Record<Role, string> = {
  produsen: "Petambak",
  verifikator: "Verifikator",
  konsumen: "Konsumen",
};

export const LABEL_TAHAP: Record<TahapDistribusi, string> = {
  tambak: "Tambak",
  gudang_koperasi: "Gudang Koperasi",
  distributor: "Distributor",
  konsumen: "Konsumen",
};

export const AMBANG_5_INDIKATOR = [
  {
    kunci: "warna",
    label: "Warna Kristal",
    jenis: "Observasi langsung",
    aturan: "Putih tulang alami atau putih bersih, tidak belang",
  },
  {
    kunci: "tekstur",
    label: "Tekstur & Ukuran Butiran",
    jenis: "Observasi langsung",
    aturan: "Kasar / krosok menjadi ciri garam tradisional",
  },
  {
    kunci: "kadar_air",
    label: "Kadar Air",
    jenis: "Alat ukur (moisture meter)",
    aturan: "Maksimal 7% (acuan SNI 3556:2016)",
  },
  {
    kunci: "salinitas",
    label: "Salinitas / NaCl",
    jenis: "Alat ukur (salinometer)",
    aturan: "Minimal 94% (acuan SNI 3556:2016)",
  },
  {
    kunci: "dokumen",
    label: "Klaim Dokumen Asal",
    jenis: "Dokumen",
    aturan: "Nomor surat kelompok tani / IG terdaftar",
  },
] as const;
