# Jawaban Pertanyaan Utama Presentasi

### Proyek: Verifikasi Keaslian Garam Lokal dengan Pengetahuan Lokal, AI, dan Blockchain

> **Cara pakai:** setiap pertanyaan punya **jawaban singkat** untuk slide dan **penjelasan** untuk berbicara. File ini sengaja membedakan mana yang **sudah diimplementasikan**, mana yang **baru dirancang**, dan mana yang **simulasi**—agar presentasi tidak overclaim.

---

## Ringkasan 7 jawaban

| Pertanyaan | Jawaban inti |
|---|---|
| 1. Masalah apa yang diselesaikan? | Garam lokal rawan dicampur, asal-usulnya dimanipulasi, dan mutunya sulit dicek konsumen; produsen jujur kalah saing. |
| 2. Siapa pemilik pengetahuan lokal? | MPIG/petambak Amed, petambak Madura, dan petambak Cirebon—tetapi pada prototipe ini **tidak ada wawancara**; sumbernya dokumen publik dan jurnal. |
| 3. Bagaimana pengetahuan menjadi aturan? | Lima indikator diterjemahkan menjadi metode pemeriksaan, ambang, bobot, status, dan bukti hash. |
| 4. Apa peran blockchain yang tidak bisa digantikan pencatatan biasa? | Memberi catatan yang tamper-evident, bertimestamp, ditandatangani wallet pengesah, dan bisa diaudit lintas pihak. |
| 5. Mengapa blockchain dan data apa yang dicatat? | Untuk integritas catatan setelah disahkan; yang dicatat adalah hash, identitas batch, wallet, waktu, status, dan riwayat distribusi—bukan foto mentah. |
| 6. Bagaimana mendeteksi data palsu sebelum masuk blockchain? | Lewat validasi input, cek duplikat, verifikasi dokumen, uji lab/alat, pemeriksaan verifikator, dan rekomputasi hash. |
| 7. Apa bukti dan keterbatasannya? | Prototipe berjalan dan build lolos; tetapi AI masih simulasi rule-based, blockchain masih simulasi, dan pengujian formal belum didokumentasikan. |

---

## 1. Apa masalah pemalsuan atau ketidakjelasan mutu yang ingin diselesaikan?

**Jawaban singkat:**
Konsumen sulit membedakan garam lokal asli dari garam yang dicampur, berasal dari daerah lain, atau mutunya di bawah standar. Produsen kecil yang jujur ikut dirugikan karena harga dan reputasinya turun.

**Penjelasan:**

- Garam lokal punya nilai ekonomi dan reputasi daerah—contohnya Garam Amed Bali yang sudah berlabel Indikasi Geografis (IG) sejak 2015.
- Risiko yang ingin diselesaikan bukan hanya “garam palsu”, tetapi juga:
  - pencampuran dengan garam rafinasi/industri;
  - klaim asal yang tidak benar;
  - label/logo IG yang dipakai tanpa hak;
  - mutu yang tidak sesuai SNI, misalnya kadar air atau NaCl di luar ambang.
- Di lapangan, pengetahuan lokal sebenarnya sudah dipakai: warna, tekstur, kadar kering, rasa asin, dan dokumen asal. Masalahnya, pengetahuan itu belum diterjemahkan menjadi catatan digital yang bisa diperiksa konsumen.
- Studi kasus prototipe memakai tiga wilayah:
  - **Amed, Bali:** garam premium IG, tetapi konsumen di luar kemasan sulit memverifikasi batch.
  - **Madura:** sentra garam rakyat; garam krosok masih perlu diolah dan kualitasnya bervariasi.
  - **Cirebon:** garam tradisional sering masuk kualitas III, sehingga perlu dibedakan dari garam teknologi lain.
- Yang ingin dibuat bukan “alat pendeteksi palsu otomatis”, melainkan **sistem bukti berlapis**: pengetahuan lokal → aturan → AI sebagai indikasi awal → pengesahan komunitas → catatan yang bisa ditelusuri.

**Bukti/rujukan:** `DOKUMENTASI-GARAM.md` bagian 1 dan 3; `SKEMA.md` §1.

---

## 2. Siapa pemilik pengetahuan lokal yang dilibatkan?

**Jawaban singkat:**
Pemilik pengetahuannya adalah MPIG Garam Amed Bali dan petambak Amed, petambak Madura, serta petambak Pangenan/Cirebon. **Pada prototipe ini tidak ada wawancara langsung**; yang dipakai adalah dokumentasi publik, dokumen IG, dan jurnal.

**Penjelasan:**

- Ini poin yang harus dijawab jujur. Jangan mengatakan “kami mewawancarai petambak” jika memang tidak.
- Sumber yang dipakai:
  - **MPIG Garam Amed Bali** dan paparan I Nengah Suanda (2019) untuk karakter garam Amed: NaCl 95–96%, bersih, lunak, kering, mudah larut, asin kuat.
  - **WIPO (2021)** untuk metode produksi Amed dan praktik ketertelusuran kode kemasan.
  - **KKP (2024)** untuk daftar garam Bali ber-IG: Amed, Kusamba, Tejakula, Kumbrih.
  - **Heriyadi et al. (2025)** untuk klasifikasi visual garam tradisional/geomembran/tunnel di Pangenan, Cirebon.
  - **Wulandari et al. (2023)** dan **Kurniawan & Azizi (2012)** untuk konteks garam krosok dan petambak Madura.
- Jadi, “pemilik pengetahuan” tetap komunitas dan penulis dokumen. Aplikasi tidak mengklaim co-creation dengan komunitas.
- Dalam sistem nyata, pihak yang mengesahkan seharusnya:
  - **warna/tekstur:** verifikator komunitas/MPIG;
  - **kadar air/salinitas:** laboratorium atau operator alat terkalibrasi;
  - **dokumen:** MPIG, dinas, atau registry IG;
  - **batch:** verifikator terdaftar yang menandatangani dengan wallet.
- Etika: tidak ada data pribadi yang dikumpulkan; sumber publik diberi atribusi; jika nanti ada wawancara, harus ada informed consent dan izin publikasi.

**Bukti/rujukan:** `DOKUMENTASI-GARAM.md` bagian 3, 8, dan 10; `SKEMA.md` §4.

---

## 3. Bagaimana pengetahuan lokal diterjemahkan menjadi aturan yang dapat diperiksa?

**Jawaban singkat:**
Setiap pengetahuan diubah menjadi lima indikator yang punya metode, ambang, bobot, status, dan bukti catatan. AI hanya menghitung indikasi awal; verifikator komunitas yang mengesahkan.

**Penjelasan:**

| Indikator | Metode | Aturan skor prototipe | Bobot | Pihak yang mengesahkan |
|---|---|---|---|---|
| Warna kristal | Observasi visual + foto | `putih_tulang` = 100; `putih_bersih` = 85 | 15% | Verifikator komunitas/MPIG |
| Tekstur butiran | Observasi visual + raba | `kasar_krosok` = 100; `halus_merata` = 50 | 20% | Verifikator komunitas/MPIG |
| Kadar air | Moisture meter | ≤7% = 100; 7–10% turun 100→60; >10% turun 60→20 | 20% | Lab/operator alat |
| Salinitas/NaCl | Salinometer/refraktometer/uji lab | ≥94% = 100; 90–<94% = 60→99; <90% turun 60→20 | 25% | Lab/operator alat |
| Dokumen asal | Cek nomor surat/IG | Kosong = 20; salah satu kosong = 40; format valid = 100; format lain = 70 | 20% | MPIG/dinas/registry |

**Rumus total:**

```text
Skor = 0.15·W + 0.20·T + 0.20·A + 0.25·S + 0.20·D
```

- `≥75` → “Sesuai Standar Garam Lokal”
- `<75` → “Indikasi Pencampuran Garam Rafinasi”
- Setiap indikator juga punya status sendiri: **Lolos / Tinjau / Gagal**.

**Cara menjelaskan yang benar:**

- Ini bukan aturan universal. Literatur menunjukkan garam Amed berbutir kecil–sedang dan lunak, sedangkan krosok di Jawa digambarkan kasar. Jadi aturan `kasar_krosok = 100` adalah **penyederhanaan demo**, bukan kebenaran untuk semua daerah.
- “Putih tulang” juga belum ditemukan di literatur; itu hipotesis lokal yang perlu divalidasi.
- Kadar air dan salinitas tetap harus diukur; rasa “asin kuat” dan tekstur “kering” hanya petunjuk awal.
- Status indikator tidak sama dengan status batch. Batch bisa sudah disahkan komunitas, tetapi satu indikator tetap berlabel “Tinjau” sebagai catatan audit.

**Bukti/rujukan:** `SKEMA.md` §6.1–§6.3; `lib/ai.ts`; `DOKUMENTASI-GARAM.md` bagian 4. Rumus lengkap ada di **Lampiran A**.

---

## 4. Apa peran blockchain yang tidak dapat digantikan hanya dengan pencatatan biasa?

**Jawaban singkat:**
Blockchain membuat catatan yang sudah disahkan menjadi **tamper-evident**: punya hash, waktu, dan tanda tangan wallet pengesah, sehingga perubahan setelahnya bisa dideteksi dan diaudit lintas pihak.

**Penjelasan:**

- Database biasa bisa diubah oleh admin tanpa jejak yang mudah dibuktikan. Blockchain menyimpan jangkar hash yang, jika data diubah, tidak lagi cocok dengan hash aslinya.
- Yang blockchain berikan:
  1. **Integritas setelah dicatat**—perubahan data terdeteksi.
  2. **Timestamp**—kapan batch disahkan.
  3. **Atribusi pengesah**—wallet verifikator menandatangani.
  4. **Audit publik**—konsumen/pihak lain bisa memeriksa catatan yang sama.
- Tetapi blockchain **tidak otomatis menjamin kebenaran data awal**. Kalau petambak memasukkan angka palsu, blockchain hanya menjaga angka palsu itu tetap konsisten. Karena itu, sebelum masuk blockchain harus ada pemeriksaan komunitas, dokumen, dan lab.
- Dalam prototipe ini, bagian blockchain masih **simulasi**:
  - Phantom `signMessage` benar-benar dipanggil jika Phantom tersedia.
  - Tidak ada `sendTransaction`; tidak ada transaksi Solana nyata.
  - `txHash` yang ditampilkan adalah signature Base58, bukan transaction hash.
  - `slot` dan `programId` disimulasikan.
  - Karena hanya `signMessage`, riwayat transaksi di Phantom memang kosong.
- Jadi jawaban presentasi yang tepat: “Blockchain di sini adalah **rancangan dan simulasi alur integritas**, bukan deployment on-chain.”

**Bukti/rujukan:** `SKEMA.md` §2, §3, §12; `lib/blockchain.ts`.

---

## 5. Mengapa blockchain diperlukan dan data apa yang dicatat?

**Jawaban singkat:**
Blockchain diperlukan karena ada beberapa pihak yang tidak punya satu admin tepercaya: petambak, verifikator komunitas, dan konsumen. Yang dicatat adalah bukti hash dan metadata pengesahan; data mentah tetap off-chain.

**Penjelasan:**

| Data | Lokasi | Alasan |
|---|---|---|
| ID batch/hash, `recordHash`, wallet petambak, wallet verifikator | On-chain (dirancang) | Bukti identitas dan pengesahan |
| Waktu panen, waktu pengesahan, status batch, skor AI | On-chain (dirancang) | Ketertelusuran dan audit |
| Hash dokumen dan hash per tahap distribusi | On-chain (dirancang) | Dokumen dan rantai distribusi tidak mudah diubah |
| Detail 5 indikator, narasi AI, dokumen asli | Off-chain | Privasi dan biaya |
| Foto mentah | Off-chain | Tidak perlu diunggah; cukup hash-nya |
| Data pribadi | Off-chain | Tidak boleh masuk chain publik |

**Mengapa tidak cukup dengan database biasa?**

- Kalau hanya satu admin yang dipercaya, database biasa cukup.
- Blockchain menjadi relevan ketika ada **sengketa** dan **banyak pihak**: petambak, MPIG/verifikator, distributor, konsumen.
- Dengan hash + signature, pihak lain bisa memeriksa apakah catatan berubah setelah disahkan.
- QR pada kemasan mengarah ke catatan batch; konsumen bisa melihat siapa yang mengesahkan dan apa yang berubah.

**Batasnya:** blockchain tidak membuktikan isi fisik karung. Ia hanya membuktikan bahwa catatan yang disepakati tidak berubah. Pembuktian mutu fisik tetap butuh lab dan pemeriksaan komunitas.

**Bukti/rujukan:** `SKEMA.md` §2, §5, §7, §8.

---

## 6. Bagaimana sistem mendeteksi data palsu sebelum masuk ke blockchain?

**Jawaban singkat:**
Sistem memakai beberapa lapis: validasi form, cek ID duplikat, verifikasi dokumen, uji lab/alat, pemeriksaan verifikator, rekomputasi hash, dan baru kemudian pengesahan wallet.

**Yang sudah ada di prototipe:**

1. **Validasi input**—field wajib, rentang nilai, format dokumen.
2. **Cek ID batch duplikat**—aplikasi menolak ID yang sudah dipakai.
3. **Analisis AI**—skor dan status per indikator; indikator bermasalah diberi `Tinjau`/`Gagal`.
4. **Antrean verifikator**—batch masuk `MENUNGGU_PENGESAHAN` dan harus ditinjau manusia.
5. **Pengesahan wallet**—verifikator menandatangani payload yang memuat batch ID dan `recordHash`.
6. **Hash rekaman**—data batch di-hash; perubahan data akan mengubah hash.

**Yang masih harus ditambahkan agar benar-benar kuat:**

- **Verifikasi dokumen ke penerbit**, bukan hanya mencocokkan format nomor. Saat ini `skorDokumen` hanya mengecek panjang dan karakter.
- **Verifikasi hasil lab/alat**—lampiran hasil uji, operator, dan kalibrasi.
- **Registry verifikator**—hanya wallet terdaftar yang boleh mengesahkan; saat ini role switcher masih untuk demo.
- **Rekomputasi hash di sisi verifier**—bandingkan hash yang dihitung ulang dengan hash yang ditandatangani.
- **Hash foto**—mendeteksi foto yang diganti setelah upload, tetapi tidak membuktikan foto itu sendiri asli.
- **Pemeriksaan on-chain**—kontrak menolak batch duplikat, status salah, atau wallet tidak berwenang.

**Checklist pra-blockchain yang disarankan:**

1. Identitas petambak dan wallet valid.
2. ID batch unik.
3. Dokumen dicek ke MPIG/dinas/registry.
4. Kadar air dan salinitas diukur dengan alat/lab yang sesuai.
5. Foto asli disimpan off-chain; hash-nya dicatat.
6. `recordHash` dihitung ulang dan cocok.
7. Verifikator komunitas menandatangani.
8. Baru data masuk ke antrean pencatatan.

**Kalimat jujur untuk presentasi:** “Deteksi data palsu tidak sepenuhnya otomatis. AI dan hash membantu menemukan kejanggalan, tetapi keputusan akhir tetap lewat verifikasi manusia dan bukti laboratorium.”

**Bukti/rujukan:** `lib/ai.ts`, `lib/blockchain.ts`, `app/page.tsx`, `SKEMA.md` §6–§7.

---

## 7. Apa bukti bahwa rancangan sistem bekerja dan apa keterbatasannya?

**Jawaban singkat:**
Prototipe sudah menjalankan alur utama: input batch → analisis AI → antrean verifikator → `signMessage` → sertifikat/QR. Build, TypeScript, dan lint lolos. Tetapi AI dan blockchain masih simulasi, dan pengujian formal belum didokumentasikan.

**Bukti yang sudah ada:**

- **Tiga batch dummy** dengan status berbeda:
  - `GRM-AMED-2026-001` — terverifikasi.
  - `GRM-MDR-2026-002` — menunggu pengesahan.
  - `GRM-CRB-2026-003` — sengketa.
- **Alur 3 peran/tab:** petambak, verifikator, konsumen.
- **Fitur:** input 5 indikator, upload foto opsional, analisis AI, pengesahan `signMessage`, sengketa/revisi, sertifikat, QR, riwayat distribusi.
- **Pemeriksaan teknis:** `npm run build`, `npx tsc --noEmit`, dan `npm run lint` berhasil.
- **Uji manual/headless yang sudah dilakukan:** upload foto, autofill tutorial dokumen, sertifikat terverifikasi dengan catatan `Tinjau`, tampilan mobile, dan print.
- **Dokumentasi sumber:** 12 sumber literatur/dokumen publik di `DOKUMENTASI-GARAM.md`.

**Keterbatasan yang harus disebut:**

1. **AI bukan model terlatih.** `GaramVision v0.1` adalah simulasi rule-based. Foto hanya menghasilkan sinyal deterministik dari hash, bukan computer vision.
2. **Blockchain bukan on-chain nyata.** Hanya `signMessage`; tidak ada `sendTransaction`. `txHash` adalah signature, `slot`/`programId` simulasi, dan riwayat Phantom kosong.
3. **Data masih lokal.** Batch baru disimpan di `localStorage`; QR batch baru hanya terlihat di browser yang sama.
4. **Dokumen belum diverifikasi ke registry.** Yang dicek baru format nomor.
5. **Belum ada integrasi lab.** Kadar air/salinitas diisi manual, bukan hasil alat otomatis.
6. **Pengetahuan lokal masih studi pustaka.** Tidak ada wawancara; klaim “pemilik pengetahuan” harus disampaikan sebagai dokumentasi, bukan partisipasi langsung.
7. **Aturan warna/tekstur terlalu global.** Literatur Amed menyebut kristal kecil–sedang, sedangkan prototipe memakai `kasar_krosok`; ini penyederhanaan demo.
8. **Belum ada veto indikator.** Satu indikator bisa `Gagal`, tetapi skor total masih bisa ≥75 dan berstatus “Sesuai”. Ini perlu diperbaiki.
9. **Acuan SNI.** Prototipe memakai SNI 3556:2016; SNI 3556:2024 sudah diberlakukan wajib dan perlu diverifikasi ulang.
10. **QR membuktikan catatan, bukan isi fisik.** Konsumen tetap perlu percaya pada proses pengesahan dan pengawasan.

**Apa yang akan memperkuat bukti:**

- Tabel pengujian formal berisi skenario, input, hasil yang diharapkan, hasil aktual, dan screenshot.
- Uji batas: kadar air 7%/10%, salinitas 94%/90%, format dokumen valid/tidak.
- Uji alur sengketa dan revisi.
- Uji QR di perangkat lain.
- Opsional: transaksi Memo nyata di Solana Devnet agar ada bukti on-chain yang bisa dicek di explorer.

**Kesimpulan presentasi:**
“Prototipe ini membuktikan **alur verifikasi** dan **keterhubungan pengetahuan lokal–AI–pengesahan komunitas–catatan hash** dapat berjalan. Prototipe belum membuktikan akurasi deteksi fisik atau integrasi blockchain produksi; itu keterbatasan yang kami nyatakan terbuka.”

---

## Catatan penyampaian agar tidak overclaim

- Jangan bilang **“AI mendeteksi keaslian”**; bilang **“AI memberi indikasi awal”**.
- Jangan bilang **“tercatat di blockchain”** tanpa menjelaskan **“simulasi”**.
- Jangan bilang **“hasil wawancara”**; bilang **“studi dokumentasi”**.
- Jangan bilang **“garam kasar pasti asli”**; literatur justru menunjukkan variasi daerah.
- Jangan bilang **“blockchain menjamin garam asli”**; blockchain hanya menjaga integritas catatan.
- Jangan bilang **“semua petambak setuju”**; yang ada adalah dokumen dan sumber tertentu.

---

## Rujukan internal

- `DOKUMENTASI-GARAM.md` — sumber pengetahuan lokal, kutipan, etika, dan batas klaim.
- `SKEMA.md` — arsitektur, aturan, skema data, smart contract, dan batasan.
- `lib/ai.ts` — rumus skor dan status indikator.
- `lib/blockchain.ts` — hash, `signMessage`, dan bukti simulasi.
- `lib/dummy.ts` — tiga batch demo.
- `uts.txt` §10 — tujuh pertanyaan presentasi.

---

## Lampiran A — Rumus AI lengkap (`lib/ai.ts`)

**Model:** `GaramVision v0.1 (simulasi rule-based)`  
**Bukan:** model machine learning terlatih, computer vision, atau OCR.

### A.1 Bobot dan rumus total

| Indikator | Simbol | Bobot |
|---|---|---:|
| Warna kristal | `W` | 15% |
| Tekstur butiran | `T` | 20% |
| Kadar air | `A` | 20% |
| Salinitas/NaCl | `S` | 25% |
| Dokumen asal | `D` | 20% |

```text
skorMentah = 0,15·W + 0,20·T + 0,20·A + 0,25·S + 0,20·D
skor       = round(clamp(skorMentah, 0, 100))
```

**Ambang keputusan:**

```text
skor ≥ 75  → "Sesuai Standar Garam Lokal"
skor < 75  → "Indikasi Pencampuran Garam Rafinasi"
```

### A.2 Skor warna dan tekstur

Nilai dasar:

```text
baseWarna   = 100 jika warna = "putih_tulang", selain itu 85
baseTekstur = 100 jika tekstur = "kasar_krosok", selain itu 50
```

Jika ada foto, foto di-hash SHA-256 lalu hash dipakai sebagai seed:

```text
citraWarna   = clamp(baseWarna   × 0,8 + (60 + seedByte(hash, 0) × 40) × 0,2, 0, 100)
citraTekstur = clamp(baseTekstur × 0,8 + (60 + seedByte(hash, 1) × 40) × 0,2, 0, 100)

W = baseWarna   × 0,5 + citraWarna   × 0,5
T = baseTekstur × 0,5 + citraTekstur × 0,5
```

Jika tidak ada foto:

```text
W = baseWarna
T = baseTekstur
```

`seedByte(hash, i)` mengambil dua karakter heksadesimal pada posisi `(i × 2) mod 62`, lalu membaginya dengan 255. Nilainya hanya sinyal deterministik dari hash—**bukan analisis isi gambar**.

### A.3 Skor kadar air

```text
A(x) = 100                                    jika x ≤ 7
A(x) = 100 − ((x − 7) / 3) × 40               jika 7 < x ≤ 10
A(x) = max(20, 60 − (x − 10) × 8)             jika x > 10
```

Contoh: `x = 10%` → `A = 60`; `x = 12%` → `A = 44`.

### A.4 Skor salinitas

```text
S(x) = 100                                    jika x ≥ 94
S(x) = 60 + ((x − 90) / 4) × 39               jika 90 ≤ x < 94
S(x) = max(20, 60 − (90 − x) × 8)             jika x < 90
```

Contoh: `x = 90%` → `S = 60`; `x = 92%` → `S = 79,5`.

### A.5 Skor dokumen

```text
D = 20   jika nomor dokumen dan nama kelompok kosong
D = 40   jika salah satu kosong
D = 100  jika panjang nomor ≥ 8 dan mengandung "/", "-", atau "."
D = 70   untuk format lainnya
```

Nilai `D` hanya mengecek **format**, belum memverifikasi dokumen ke MPIG, dinas, atau registry IG.

### A.6 Status per indikator

| Indikator | `Lolos` | `Tinjau` | `Gagal` |
|---|---|---|---|
| Warna | `putih_tulang` | `putih_bersih` | — |
| Tekstur | `kasar_krosok` | `halus_merata` | — |
| Kadar air | `≤7%` | `7–10%` | `>10%` |
| Salinitas | `≥94%` | `90–<94%` | `<90%` |
| Dokumen | skor 100 | skor 70 | skor 20/40 |

### A.7 Contoh perhitungan

Misalnya:

```text
W = 85, T = 50, A = 60, S = 60, D = 70
```

Maka:

```text
skor = 0,15(85) + 0,20(50) + 0,20(60) + 0,25(60) + 0,20(70)
     = 12,75 + 10 + 12 + 15 + 14
     = 63,75
     ≈ 64
```

Hasil: **Indikasi Pencampuran Garam Rafinasi**, karena `64 < 75`.

### A.8 Batasan rumus

- Status keseluruhan hanya memakai skor total; belum ada **veto** untuk indikator yang `Gagal`.
- `faktorRisiko` hanya memengaruhi narasi, bukan membatalkan hasil.
- Warna dan tekstur adalah penyederhanaan demo; literatur menunjukkan ciri garam berbeda antar-daerah.
- Foto tidak dianalisis secara visual; hanya hash-nya yang memengaruhi skor warna/tekstur.
- Dokumen belum dicek ke registry; kadar air/salinitas belum terhubung ke alat lab.
- Rumus ini adalah **indikasi awal**, bukan pengganti uji laboratorium atau keputusan verifikator.
