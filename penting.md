# Catatan Penting — Verifikasi Garam

## IG-SALT pada Indikator Dokumen Asal

`IG-SALT` adalah contoh/placeholder nomor dokumen di prototipe. Ini **bukan singkatan resmi** dan bukan Instagram.

Di skema awal hanya disebut "nomor surat kelompok tani/IG" tanpa definisi. Di aplikasi, `IG` dimaksudkan sebagai dokumen izin/identitas garam tingkat kelompok.

Contoh pembacaan:

- `IG-SALT-BALI/041/2026`
  - `IG` = dokumen izin/identitas garam
  - `SALT` = garam
  - `BALI` = wilayah
  - `041` = nomor urut
  - `2026` = tahun

## Kenapa Muncul Status "Tinjau"

- `IG-SALT-BALI/041/2026` → format lengkap → skor dokumen 100 → **Lolos**.
- `017MDR` → format tidak lengkap → skor dokumen 70 → **Tinjau**.
- **Tinjau** berarti perlu verifikasi manual oleh verifikator komunitas, bukan otomatis ditolak.
- Aplikasi tidak mengecek ke database resmi; verifikator mencocokkan nomor surat dengan surat/catatan kelompok.

## Saran Penulisan UI

Agar tidak ambigu:

- Ganti "kelompok/IG" menjadi "surat kelompok/izin garam".
- Ganti placeholder `IG-SALT-BALI/041/2026` menjadi "No. surat kelompok / izin garam".

## Catatan Status Batch vs Indikator

- Status batch **Terverifikasi** = batch sudah disahkan komunitas.
- Status indikator **Tinjau** = parameter masih perlu dipantau/dicatat; bukan berarti batch masih menunggu pengesahan.
- Setelah pengesahan, narasi AI di sertifikat menyesuaikan: parameter Tinjau disebut "disahkan dengan catatan pemantauan".
