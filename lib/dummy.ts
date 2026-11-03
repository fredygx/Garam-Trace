import { hitungHasilAI } from "./ai";
import { DEMO_WALLETS, PROGRAM_ID_SIMULASI } from "./constants";
import type { BatchGaram } from "./types";

const amed: BatchGaram = {
  id: "GRM-AMED-2026-001",
  namaTambak: "Tambak Garam Amed",
  lokasi: "Amed, Karangasem, Bali",
  tanggalPanen: "2026-09-12",
  metodeProduksi: "kristalisasi_tradisional",
  indikator: {
    warnaKristal: "putih_bersih",
    teksturButiran: "kasar_krosok",
    kadarAirPersen: 7.9,
    salinitasPersen: 94.6,
    nomorDokumen: "IG-SALT-BALI/041/2026",
    namaKelompok: "Kelompok Petambak Amed",
  },
  ai: hitungHasilAI(
    {
      warnaKristal: "putih_bersih",
      teksturButiran: "kasar_krosok",
      kadarAirPersen: 7.9,
      salinitasPersen: 94.6,
      nomorDokumen: "IG-SALT-BALI/041/2026",
      namaKelompok: "Kelompok Petambak Amed",
    },
    undefined,
    "2026-09-20T08:30:00.000Z",
  ),
  status: "TERVERIFIKASI",
  walletPetambak: DEMO_WALLETS.petambak,
  blockchain: {
    network: "solana-devnet",
    txHash:
      "5xZHEtMMqfWq31P7jo2hjnFE2CZDkf7sfCcPBWQHju1sCT42hpp7s9r4WJKewkYbLJBH4fy9ropZkw3FCa6YW6NL",
    slot: 287_654_321,
    recordHash:
      "fad26e50174ece8bf2e2c4ecd624cf515a38fb18f0f3925b4a8e7623be205836",
    walletPetambak: DEMO_WALLETS.petambak,
    walletVerifikator: DEMO_WALLETS.verifikator,
    disahkanPada: "2026-09-20T09:12:00.000Z",
    programId: PROGRAM_ID_SIMULASI,
    mode: "simulasi",
  },
  distribusi: [
    {
      tahap: "tambak",
      lokasi: "Amed, Karangasem, Bali",
      waktu: "2026-09-12T09:00:00.000Z",
      aktor: "Kelompok Petambak Amed",
      catatan: "Panen dan pengeringan kristal garam.",
    },
    {
      tahap: "gudang_koperasi",
      lokasi: "Gudang Koperasi Saltbumi, Karangasem",
      waktu: "2026-09-15T03:30:00.000Z",
      aktor: "Koperasi Saltbumi",
      catatan: "Pemeriksaan kemasan dan pencatatan stok.",
    },
    {
      tahap: "distributor",
      lokasi: "Distributor Bali Organic, Denpasar",
      waktu: "2026-09-18T02:00:00.000Z",
      aktor: "Bali Organic Distribution",
      catatan: "Pengiriman ke jaringan toko oleh-oleh.",
    },
    {
      tahap: "konsumen",
      lokasi: "Denpasar, Bali",
      waktu: "2026-09-21T10:15:00.000Z",
      aktor: "Konsumen terverifikasi",
      catatan: "QR dipindai dan sertifikat diverifikasi.",
    },
  ],
  dibuatPada: "2026-09-20T08:30:00.000Z",
  diperbaruiPada: "2026-09-20T09:12:00.000Z",
};

const madura: BatchGaram = {
  id: "GRM-MDR-2026-002",
  namaTambak: "Kelompok Petambak Garam Sumenep",
  lokasi: "Sumenep, Madura, Jawa Timur",
  tanggalPanen: "2026-10-02",
  metodeProduksi: "kristalisasi_tradisional",
  indikator: {
    warnaKristal: "putih_tulang",
    teksturButiran: "kasar_krosok",
    kadarAirPersen: 8.7,
    salinitasPersen: 93.2,
    nomorDokumen: "017MDR",
    namaKelompok: "Kelompok Petambak Garam Sumenep",
    fotoKristalDataUrl: undefined,
  },
  ai: hitungHasilAI(
    {
      warnaKristal: "putih_tulang",
      teksturButiran: "kasar_krosok",
      kadarAirPersen: 8.7,
      salinitasPersen: 93.2,
      nomorDokumen: "017MDR",
      namaKelompok: "Kelompok Petambak Garam Sumenep",
    },
    undefined,
    "2026-10-02T10:15:00.000Z",
  ),
  status: "MENUNGGU_PENGESAHAN",
  walletPetambak: DEMO_WALLETS.petambak,
  distribusi: [],
  dibuatPada: "2026-10-02T10:15:00.000Z",
  diperbaruiPada: "2026-10-02T10:15:00.000Z",
};

const cirebon: BatchGaram = {
  id: "GRM-CRB-2026-003",
  namaTambak: "Tambak Garam Cirebon",
  lokasi: "Cirebon, Jawa Barat",
  tanggalPanen: "2026-10-05",
  metodeProduksi: "meja_geomembran",
  indikator: {
    warnaKristal: "putih_bersih",
    teksturButiran: "halus_merata",
    kadarAirPersen: 11.2,
    salinitasPersen: 88.5,
    nomorDokumen: "",
    namaKelompok: "Kelompok Garam Cirebon",
  },
  ai: hitungHasilAI(
    {
      warnaKristal: "putih_bersih",
      teksturButiran: "halus_merata",
      kadarAirPersen: 11.2,
      salinitasPersen: 88.5,
      nomorDokumen: "",
      namaKelompok: "Kelompok Garam Cirebon",
    },
    undefined,
    "2026-10-05T14:20:00.000Z",
  ),
  status: "SENGKETA",
  walletPetambak: DEMO_WALLETS.petambak,
  catatanVerifikator:
    "Verifikator meminta produsen melengkapi surat kelompok tani dan mengulang pengambilan sampel.",
  alasanSengketa:
    "Butiran terlalu halus dan seragam, kadar air tinggi, serta nomor dokumen asal belum dilampirkan. Perlu klarifikasi metode produksi dan asal bahan.",
  distribusi: [],
  dibuatPada: "2026-10-05T14:20:00.000Z",
  diperbaruiPada: "2026-10-06T02:00:00.000Z",
};

export const DUMMY_BATCHES: BatchGaram[] = [amed, madura, cirebon];
