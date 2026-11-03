import {
  AMBANG_AI,
  BOBOT_AI,
  DISCLAIMER_AI,
  LABEL_TEKSTUR,
  LABEL_WARNA,
  MODEL_AI,
} from "./constants";
import type {
  AIResult,
  EvaluasiIndikator,
  IndikatorVerifikasi,
  SubSkorAI,
} from "./types";
import { clamp, formatPersen, sha256Hex } from "./utils";

function skorKadarAir(value: number) {
  if (!Number.isFinite(value)) return 20;
  if (value <= 7) return 100;
  if (value <= 10) return 100 - ((value - 7) / 3) * 40;
  return Math.max(20, 60 - (value - 10) * 8);
}

function skorSalinitas(value: number) {
  if (!Number.isFinite(value)) return 20;
  if (value >= 94) return 100;
  if (value >= 90) return 60 + ((value - 90) / 4) * 39;
  return Math.max(20, 60 - (90 - value) * 8);
}

export function skorDokumen(nomor: string, kelompok: string) {
  const nomorBersih = nomor.trim();
  const kelompokBersih = kelompok.trim();
  if (!nomorBersih && !kelompokBersih) return 20;
  if (!nomorBersih || !kelompokBersih) return 40;
  if (nomorBersih.length >= 8 && /[/\-.]/.test(nomorBersih)) return 100;
  return 70;
}

function seedByte(seed: string, index: number) {
  const position = (index * 2) % 62;
  const value = Number.parseInt(seed.slice(position, position + 2), 16);
  return Number.isFinite(value) ? value / 255 : 0.72;
}

export function hitungHasilAI(
  indikator: IndikatorVerifikasi,
  citraSeed?: string,
  waktu = new Date().toISOString(),
): AIResult {
  const baseWarna = indikator.warnaKristal === "putih_tulang" ? 100 : 85;
  const baseTekstur = indikator.teksturButiran === "kasar_krosok" ? 100 : 50;

  let citraWarna = baseWarna;
  let citraTekstur = baseTekstur;

  if (citraSeed) {
    citraWarna = clamp(
      baseWarna * 0.8 + (60 + seedByte(citraSeed, 0) * 40) * 0.2,
      0,
      100,
    );
    citraTekstur = clamp(
      baseTekstur * 0.8 + (60 + seedByte(citraSeed, 1) * 40) * 0.2,
      0,
      100,
    );
  }

  const warna = baseWarna * 0.5 + citraWarna * 0.5;
  const tekstur = baseTekstur * 0.5 + citraTekstur * 0.5;
  const kadarAir = skorKadarAir(indikator.kadarAirPersen);
  const salinitas = skorSalinitas(indikator.salinitasPersen);
  const dokumen = skorDokumen(
    indikator.nomorDokumen,
    indikator.namaKelompok,
  );

  const skorMentah =
    warna * BOBOT_AI.warna +
    tekstur * BOBOT_AI.tekstur +
    kadarAir * BOBOT_AI.kadarAir +
    salinitas * BOBOT_AI.salinitas +
    dokumen * BOBOT_AI.dokumen;

  const skor = Math.round(clamp(skorMentah, 0, 100));
  const subSkor: SubSkorAI = {
    warna: Math.round(warna),
    tekstur: Math.round(tekstur),
    kadarAir: Math.round(kadarAir),
    salinitas: Math.round(salinitas),
    dokumen: Math.round(dokumen),
    citra: Math.round((citraWarna + citraTekstur) / 2),
  };

  const faktorRisiko: string[] = [];
  if (indikator.teksturButiran === "halus_merata") {
    faktorRisiko.push(
      "Butiran halus dan seragam adalah ciri yang sering muncul pada garam rafinasi.",
    );
  }
  if (indikator.warnaKristal === "putih_bersih") {
    faktorRisiko.push(
      "Warna sangat putih perlu dibandingkan dengan tekstur dan asal dokumen.",
    );
  }
  if (indikator.kadarAirPersen > 7) {
    faktorRisiko.push(
      `Kadar air ${formatPersen(indikator.kadarAirPersen)} berada di atas acuan SNI maksimal 7%.`,
    );
  }
  if (indikator.salinitasPersen < 94) {
    faktorRisiko.push(
      `Salinitas ${formatPersen(indikator.salinitasPersen)} berada di bawah acuan SNI minimal 94%.`,
    );
  }
  if (dokumen < 100) {
    faktorRisiko.push(
      "Dokumen asal belum lengkap atau formatnya belum dapat diverifikasi.",
    );
  }

  let ringkasan: string;
  if (skor >= AMBANG_AI && faktorRisiko.length === 0) {
    ringkasan =
      "Seluruh indikator berada dalam rentang wajar garam lokal tradisional. Hasil ini tetap memerlukan pengesahan komunitas.";
  } else if (skor >= AMBANG_AI) {
    ringkasan = `Sebagian besar indikator sesuai. ${faktorRisiko.length} parameter perlu ditinjau verifikator sebelum disahkan.`;
  } else {
    ringkasan = `Pola indikator menunjukkan ${faktorRisiko.length} sinyal yang konsisten dengan pencampuran garam rafinasi. Data perlu diperiksa komunitas.`;
  }

  return {
    skor,
    status:
      skor >= AMBANG_AI
        ? "Sesuai Standar Garam Lokal"
        : "Indikasi Pencampuran Garam Rafinasi",
    subSkor,
    ringkasan,
    faktorRisiko,
    disclaimer: DISCLAIMER_AI,
    dianalisisPada: waktu,
    model: MODEL_AI,
  };
}

export async function analisisGaram(
  indikator: IndikatorVerifikasi,
  fotoDataUrl?: string,
) {
  const citraSeed = fotoDataUrl
    ? await sha256Hex(fotoDataUrl)
    : undefined;
  return hitungHasilAI(indikator, citraSeed);
}

/**
 * Ringkasan AI untuk batch yang sudah disahkan. Data analisis awal tidak
 * diubah; hanya narasi tampilannya yang disesuaikan dengan status akhir.
 */
export function ringkasanPascaPengesahan(ai: AIResult): string {
  if (ai.skor >= AMBANG_AI) {
    return ai.faktorRisiko.length > 0
      ? `Sebagian besar indikator sesuai. ${ai.faktorRisiko.length} parameter telah disahkan dengan catatan pemantauan.`
      : "Seluruh indikator berada dalam rentang wajar. Batch telah disahkan komunitas.";
  }

  return `AI mendeteksi ${ai.faktorRisiko.length} sinyal risiko. Batch telah diperiksa dan disahkan komunitas dengan catatan.`;
}

export function evaluasiIndikator(
  indikator: IndikatorVerifikasi,
): EvaluasiIndikator[] {
  const dokumen = skorDokumen(indikator.nomorDokumen, indikator.namaKelompok);

  return [
    {
      kunci: "warna",
      label: "Warna Kristal",
      nilai: LABEL_WARNA[indikator.warnaKristal],
      status: indikator.warnaKristal === "putih_tulang" ? "lolos" : "tinjau",
      catatan:
        indikator.warnaKristal === "putih_tulang"
          ? "Sesuai ciri garam alami."
          : "Warna sangat putih perlu dicek bersama tekstur.",
    },
    {
      kunci: "tekstur",
      label: "Tekstur & Butiran",
      nilai: LABEL_TEKSTUR[indikator.teksturButiran],
      status:
        indikator.teksturButiran === "kasar_krosok" ? "lolos" : "tinjau",
      catatan:
        indikator.teksturButiran === "kasar_krosok"
          ? "Ciri garam tradisional."
          : "Butiran halus seragam perlu ditinjau.",
    },
    {
      kunci: "kadar_air",
      label: "Kadar Air",
      nilai: formatPersen(indikator.kadarAirPersen),
      status:
        indikator.kadarAirPersen <= 7
          ? "lolos"
          : indikator.kadarAirPersen <= 10
            ? "tinjau"
            : "gagal",
      catatan:
        indikator.kadarAirPersen <= 7
          ? "Memenuhi acuan maksimal 7%."
          : "Di atas acuan SNI 3556:2016 (maks. 7%).",
    },
    {
      kunci: "salinitas",
      label: "Salinitas / NaCl",
      nilai: formatPersen(indikator.salinitasPersen),
      status:
        indikator.salinitasPersen >= 94
          ? "lolos"
          : indikator.salinitasPersen >= 90
            ? "tinjau"
            : "gagal",
      catatan:
        indikator.salinitasPersen >= 94
          ? "Memenuhi acuan minimal 94%."
          : "Di bawah acuan SNI 3556:2016 (min. 94%).",
    },
    {
      kunci: "dokumen",
      label: "Dokumen Asal",
      nilai: indikator.nomorDokumen.trim() || "Belum ada",
      status: dokumen === 100 ? "lolos" : dokumen >= 70 ? "tinjau" : "gagal",
      catatan:
        dokumen === 100
          ? "Format nomor surat tervalidasi."
          : "Perlu verifikasi manual surat kelompok/izin garam.",
    },
  ];
}
