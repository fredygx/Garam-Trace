export type Role = "produsen" | "verifikator" | "konsumen";

export type TabId = "petambak" | "verifikator" | "konsumen";

export type BatchStatus =
  | "MENUNGGU_PENGESAHAN"
  | "TERVERIFIKASI"
  | "SENGKETA"
  | "DITOLAK";

export type WarnaKristal = "putih_bersih" | "putih_tulang";

export type TeksturButiran = "kasar_krosok" | "halus_merata";

export type MetodeProduksi = "kristalisasi_tradisional" | "meja_geomembran";

export type AIStatus =
  | "Sesuai Standar Garam Lokal"
  | "Indikasi Pencampuran Garam Rafinasi";

export type TahapDistribusi =
  | "tambak"
  | "gudang_koperasi"
  | "distributor"
  | "konsumen";

export interface IndikatorVerifikasi {
  warnaKristal: WarnaKristal;
  teksturButiran: TeksturButiran;
  kadarAirPersen: number;
  salinitasPersen: number;
  nomorDokumen: string;
  namaKelompok: string;
  fotoKristalDataUrl?: string;
}

export interface SubSkorAI {
  warna: number;
  tekstur: number;
  kadarAir: number;
  salinitas: number;
  dokumen: number;
  citra: number;
}

export interface AIResult {
  skor: number;
  status: AIStatus;
  subSkor: SubSkorAI;
  ringkasan: string;
  faktorRisiko: string[];
  disclaimer: string;
  dianalisisPada: string;
  model: string;
}

export interface BlockchainProof {
  network: "solana-devnet";
  txHash: string;
  slot: number;
  /** Waktu blok dari chain; hanya tersedia untuk transaksi memo nyata. */
  blockTime?: number;
  /** Tautan explorer; hanya tersedia untuk transaksi memo nyata. */
  explorerUrl?: string;
  /** Isi memo yang benar-benar dikirim ke Memo Program. */
  memo?: string;
  recordHash: string;
  walletPetambak: string;
  walletVerifikator: string;
  disahkanPada: string;
  programId: string;
  mode: "devnet" | "phantom" | "simulasi";
}

export interface RiwayatDistribusi {
  tahap: TahapDistribusi;
  lokasi: string;
  waktu: string;
  aktor: string;
  catatan?: string;
}

export interface BatchGaram {
  id: string;
  namaTambak: string;
  lokasi: string;
  tanggalPanen: string;
  metodeProduksi: MetodeProduksi;
  indikator: IndikatorVerifikasi;
  ai: AIResult;
  status: BatchStatus;
  walletPetambak?: string;
  catatanVerifikator?: string;
  alasanSengketa?: string;
  blockchain?: BlockchainProof;
  distribusi: RiwayatDistribusi[];
  dibuatPada: string;
  diperbaruiPada: string;
}

export interface WalletState {
  connected: boolean;
  address: string | null;
  source: "phantom" | "demo" | null;
}

export type ToastType = "success" | "error" | "info";

export interface ToastMessage {
  id: number;
  type: ToastType;
  title: string;
  description?: string;
}

export type StatusAmbang = "lolos" | "tinjau" | "gagal";

export interface EvaluasiIndikator {
  kunci: string;
  label: string;
  nilai: string;
  status: StatusAmbang;
  catatan: string;
}
