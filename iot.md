# ESP32 → Solana Langsung (Tanpa Bridge / Cloud Middleware)

> **Status:** contoh implementasi langsung. Kode ini **belum di-flash dan diuji di board fisik** dalam sesi ini. Library Ed25519, TLS, dan RPC perlu diverifikasi di environment Arduino/PlatformIO masing-masing.

## 1. Arsitektur

```text
[Sensor] → [ESP32] --HTTPS JSON-RPC--> [Solana RPC node] → [Validator Solana]
              │
              ├─ membuat transaksi sendiri
              ├─ menandatangani dengan Ed25519
              └─ mengirim transaksi ke Memo Program v2
```

Yang **tidak** dipakai:

- bridge lintas-chain;
- backend/API perantara;
- MQTT, Firebase, Supabase, atau cloud function;
- wallet Phantom di browser.

Yang **tetap ada**:

- **RPC Solana**. Ini bukan bridge, tetapi pintu masuk JSON-RPC ke node Solana. ESP32 tidak bisa menjadi validator Solana.
- Jika ingin benar-benar tanpa layanan RPC hosted, jalankan RPC/validator sendiri di LAN (bagian 8).

## 2. Apa yang dikirim ke Solana?

Kode ini memakai **Memo Program v2**:

```text
MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr
```

Contoh memo:

```text
GARAM|v=1|dev=ESP32-GARAM-01|batch=GRM-AMED-2026-001|t=29.5|rh=62.0|m=4.8|s=95.2|ts=1770000000|n=1234567890|h=<sha256>
```

Kenapa memo:

- tidak perlu deploy program baru;
- cukup satu transaksi kecil;
- isi memo terlihat di explorer dan log transaksi;
- cocok untuk prototipe attestation sensor.

Kekurangannya: memo **tidak menegakkan aturan bisnis** seperti “batch tidak boleh duplikat” atau “hanya verifikator terdaftar yang boleh approval”. Untuk itu perlu program Solana sendiri (bagian 9).

Nilai `h=` adalah **SHA-256 dari seluruh string memo sebelum `|h=`**. Jadi verifier bisa menghitung ulang hash dan mencocokkannya.

> **Penting:** memo bersifat publik dan permanen. Jangan kirim data pribadi, kunci, atau dokumen rahasia ke memo. Kirim hash bila data sensitif.

## 3. Kebutuhan

### Hardware

- ESP32 DevKit / ESP32-S3. ESP32-S3 dengan PSRAM lebih aman untuk TLS + signing.
- Sensor DHT22 (suhu/kelembapan udara) — opsional.
- Probe analog untuk kelembapan/salinitas — **kalibrasi sendiri**.
- Adaptor 5V minimal 1A. WiFi + TLS bisa menarik arus cukup besar.

### Wiring

| Modul | Pin modul | ESP32 |
|---|---|---|
| DHT22 | VCC | 3.3V |
| DHT22 | GND | GND |
| DHT22 | DATA | GPIO4, pull-up 10k ke 3.3V |
| Probe kelembapan | VCC | 3.3V |
| Probe kelembapan | GND | GND |
| Probe kelembapan | AO | GPIO34 |
| Probe salinitas | VCC | 3.3V |
| Probe salinitas | GND | GND |
| Probe salinitas | AO | GPIO35 |

**Jangan memberi 5V ke pin ADC ESP32.** Kalau output sensor 0–5V, pakai pembagi tegangan atau level shifter. Jangan merendam probe yang tidak food-safe ke garam konsumsi.

### Software

- Arduino IDE 2.x atau PlatformIO.
- ESP32 Arduino Core.
- ArduinoJson 7.x.
- DHT sensor library + Adafruit Unified Sensor.
- Library Ed25519: `orlp/ed25519` (C, ringan).
- Solana CLI untuk funding devnet (opsional; bisa pakai faucet web).

## 4. Keamanan: baca sebelum mainnet

- Ini adalah **hot wallet di perangkat**. Siapa pun yang memegang ESP32 dan bisa membaca flash/NVS berpotensi mengambil seed.
- Buat wallet **khusus perangkat**, jangan pakai seed Phantom pengguna.
- Isi saldo secukupnya. Jangan simpan SOL bernilai besar di perangkat.
- Untuk produksi: aktifkan **secure boot**, **flash encryption**, dan **NVS encryption**.
- Jangan pernah mencetak seed ke Serial. Kode ini hanya mencetak public key.
- `setInsecure()` hanya untuk prototipe. Produksi harus memakai CA certificate dan, bila mungkin, certificate pinning.
- Data sensor bisa dipalsukan jika sensor atau firmware diubah. Tanda tangan perangkat membuktikan **identitas perangkat**, bukan kebenaran fisik garam.
- Gunakan nonce/timestamp untuk mengurangi replay. Untuk aturan ketat, validasi nonce di program on-chain.

## 5. Kode lengkap

Simpan sebagai `esp32_solana_memo/esp32_solana_memo.ino`.

```cpp
// ============================================================
// ESP32 -> Solana Devnet
// Memo Program v2, tanpa backend/bridge
//
// Alur:
//  1. baca sensor
//  2. buat memo kanonik + SHA-256
//  3. ambil recent blockhash
//  4. susun message transaksi Solana
//  5. tanda tangani Ed25519
//  6. kirim sendTransaction (base64)
// ============================================================

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Preferences.h>
#include <DHT.h>
#include <time.h>
#include <math.h>
#include <vector>
#include <string.h>
#include <esp_random.h>
#include "mbedtls/md.h"
#include "mbedtls/base64.h"
#include "ed25519.h"

// ---------------- KONFIGURASI ----------------
#define USE_TLS 1
#define USE_DUMMY_SENSORS 0

#define WIFI_SSID "GANTI_SSID"
#define WIFI_PASSWORD "GANTI_PASSWORD"

// Devnet. Untuk mainnet ganti URL dan cluster explorer.
#define RPC_URL "https://api.devnet.solana.com"

#define MEMO_PROGRAM_ID "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
#define DEVICE_ID "ESP32-GARAM-01"
#define BATCH_ID "GRM-AMED-2026-001"

#define DHT_PIN 4
#define DHT_TYPE DHT22
#define PIN_MOISTURE 34
#define PIN_SALINITY 35

// Kalibrasi kasar. Ganti dengan hasil kalibrasi probe.
const float MOISTURE_ADC_DRY = 4095.0f;
const float MOISTURE_ADC_WET = 1200.0f;

// ---------------- STATE ----------------
Preferences prefs;
uint8_t seed[32];
uint8_t pub[32];
uint8_t priv[64];
String pubB58;

DHT dht(DHT_PIN, DHT_TYPE);

struct SensorData {
  float temperature;
  float humidity;
  float moisture;
  float salinity;
};

// ---------------- BASE58 ----------------
static const char *B58_ALPHABET =
    "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

String b58encode(const uint8_t *data, size_t len) {
  size_t zeros = 0;
  while (zeros < len && data[zeros] == 0) zeros++;

  std::vector<uint8_t> digits;

  for (size_t i = zeros; i < len; i++) {
    int carry = data[i];
    for (size_t j = 0; j < digits.size(); j++) {
      int val = digits[j] * 256 + carry;
      digits[j] = val % 58;
      carry = val / 58;
    }
    while (carry > 0) {
      digits.push_back(carry % 58);
      carry /= 58;
    }
  }

  String out;
  for (size_t i = 0; i < zeros; i++) out += '1';
  for (size_t i = digits.size(); i > 0; i--) {
    out += B58_ALPHABET[digits[i - 1]];
  }
  if (out.length() == 0) out = "1";
  return out;
}

bool b58decode(const char *str, uint8_t *out, size_t outSize) {
  memset(out, 0, outSize);

  size_t len = strlen(str);
  size_t zeros = 0;
  while (zeros < len && str[zeros] == '1') zeros++;
  if (zeros > outSize) return false;

  for (size_t i = zeros; i < len; i++) {
    const char *p = strchr(B58_ALPHABET, str[i]);
    if (!p) return false;

    int carry = (int)(p - B58_ALPHABET);
    for (size_t j = outSize; j > 0; j--) {
      int val = out[j - 1] * 58 + carry;
      out[j - 1] = (uint8_t)(val & 0xFF);
      carry = val >> 8;
    }
    if (carry != 0) return false;
  }

  // Pastikan leading '1' benar-benar menjadi leading zero byte.
  for (size_t i = 0; i < zeros; i++) {
    if (out[i] != 0) return false;
  }

  return true;
}

// ---------------- UTIL ----------------
size_t writeShortVec(uint8_t *out, size_t value) {
  size_t i = 0;
  while (true) {
    uint8_t b = (uint8_t)(value & 0x7F);
    value >>= 7;
    if (value == 0) {
      out[i++] = b;
      break;
    }
    out[i++] = (uint8_t)(b | 0x80);
  }
  return i;
}

String sha256Hex(const String &text) {
  uint8_t digest[32];
  const mbedtls_md_info_t *info =
      mbedtls_md_info_from_type(MBEDTLS_MD_SHA256);

  if (!info) return "";
  if (mbedtls_md(info, (const unsigned char *)text.c_str(),
                 text.length(), digest) != 0) {
    return "";
  }

  char hex[65];
  for (size_t i = 0; i < 32; i++) {
    sprintf(hex + i * 2, "%02x", digest[i]);
  }
  hex[64] = '\0';
  return String(hex);
}

// ---------------- WALLET ----------------
void initWallet() {
  if (!prefs.begin("garam-wallet", false)) {
    Serial.println("[wallet] gagal membuka NVS");
    while (true) delay(1000);
  }

  size_t n = prefs.getBytes("seed", seed, sizeof(seed));
  if (n != sizeof(seed)) {
    esp_fill_random(seed, sizeof(seed));
    prefs.putBytes("seed", seed, sizeof(seed));
    Serial.println("[wallet] seed baru dibuat. Fund pubkey di bawah.");
  }
  prefs.end();

  ed25519_create_keypair(pub, priv, seed);
  pubB58 = b58encode(pub, 32);

  Serial.print("[wallet] pubkey: ");
  Serial.println(pubB58);
  Serial.println("[wallet] jangan bagikan seed/NVS perangkat ini.");
}

// ---------------- WIFI / NTP ----------------
void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  WiFi.mode(WIFI_STA);
  WiFi.setSleep(false);
  WiFi.setAutoReconnect(true);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.print("[wifi] connecting");
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 30000) {
    delay(500);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.print("[wifi] IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println();
    Serial.println("[wifi] gagal");
  }
}

void syncTime() {
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  struct tm timeinfo;

  for (int i = 0; i < 20; i++) {
    if (getLocalTime(&timeinfo, 500)) {
      Serial.println("[ntp] ok");
      return;
    }
  }
  Serial.println("[ntp] gagal; timestamp akan 0");
}

// ---------------- RPC ----------------
bool rpcPost(const String &body, String &response, int &code) {
#if USE_TLS
  WiFiClientSecure client;
  client.setInsecure();  // HANYA prototipe. Produksi: setCACert().
#else
  WiFiClient client;     // untuk RPC lokal via HTTP di LAN
#endif

  HTTPClient http;
  http.setTimeout(15000);

  if (!http.begin(client, RPC_URL)) {
    code = -1;
    return false;
  }

  http.addHeader("Content-Type", "application/json");
  code = http.POST(body);

  if (code > 0) {
    response = http.getString();
  }

  http.end();
  return code > 0;
}

bool getLatestBlockhash(uint8_t out[32], String &err) {
  String body =
      "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"getLatestBlockhash\","
      "\"params\":[{\"commitment\":\"confirmed\"}]}";

  String response;
  int code = 0;

  if (!rpcPost(body, response, code)) {
    err = String("HTTP ") + String(code);
    return false;
  }

  JsonDocument doc;
  DeserializationError e = deserializeJson(doc, response);
  if (e) {
    err = String("JSON: ") + e.c_str();
    return false;
  }

  const char *blockhash = doc["result"]["value"]["blockhash"] | "";
  if (!blockhash[0]) {
    err = response;
    return false;
  }

  if (!b58decode(blockhash, out, 32)) {
    err = String("base58 blockhash: ") + blockhash;
    return false;
  }

  return true;
}

bool sendTransaction(const uint8_t *tx, size_t txLen,
                     String &signature, String &err) {
  size_t b64Cap = 4 * ((txLen + 2) / 3) + 2;
  std::vector<unsigned char> b64(b64Cap);
  size_t b64Len = 0;

  int rc = mbedtls_base64_encode(b64.data(), b64.size(), &b64Len, tx, txLen);
  if (rc != 0) {
    err = "base64 encode";
    return false;
  }

  String b64s((const char *)b64.data(), (unsigned int)b64Len);

  String body =
      String("{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"sendTransaction\","
             "\"params\":[\"") +
      b64s +
      String("\",{\"encoding\":\"base64\","
             "\"skipPreflight\":false,\"preflightCommitment\":\"confirmed\"}]}");

  String response;
  int code = 0;

  if (!rpcPost(body, response, code)) {
    err = String("HTTP ") + String(code);
    return false;
  }

  JsonDocument doc;
  DeserializationError e = deserializeJson(doc, response);
  if (e) {
    err = String("JSON: ") + e.c_str();
    return false;
  }

  const char *sig = doc["result"] | "";
  if (!sig[0]) {
    err = response;
    return false;
  }

  signature = sig;
  return true;
}

// ---------------- SENSOR ----------------
SensorData readSensors() {
  SensorData d;

#if USE_DUMMY_SENSORS
  d.temperature = 29.5f;
  d.humidity = 62.0f;
  d.moisture = 4.8f;
  d.salinity = 95.2f;
  return d;
#endif

  d.temperature = dht.readTemperature();
  d.humidity = dht.readHumidity();

  if (isnan(d.temperature)) d.temperature = -1.0f;
  if (isnan(d.humidity)) d.humidity = -1.0f;

  int rawM = analogRead(PIN_MOISTURE);
  int rawS = analogRead(PIN_SALINITY);

  d.moisture = (MOISTURE_ADC_DRY - rawM) * 100.0f /
               (MOISTURE_ADC_DRY - MOISTURE_ADC_WET);
  d.moisture = constrain(d.moisture, 0.0f, 100.0f);

  // Placeholder. Kalibrasi dengan larutan standar sebelum dipakai.
  d.salinity = (rawS / 4095.0f) * 100.0f;

  return d;
}

// ---------------- MEMO / TRANSAKSI ----------------
String buildMemo(const SensorData &d) {
  time_t now = time(nullptr);
  if (now < 1700000000) now = 0;

  uint32_t nonce = esp_random();

  char payload[220];
  snprintf(payload, sizeof(payload),
           "GARAM|v=1|dev=%s|batch=%s|t=%.1f|rh=%.1f|m=%.1f|s=%.1f|ts=%lld|n=%lu",
           DEVICE_ID, BATCH_ID,
           d.temperature, d.humidity, d.moisture, d.salinity,
           (long long)now, (unsigned long)nonce);

  String hash = sha256Hex(String(payload));
  if (hash.length() != 64) return "";

  return String(payload) + "|h=" + hash;
}

bool sendMemo(const String &memo, String &signature, String &err) {
  if (memo.length() == 0 || memo.length() > 500) {
    err = "panjang memo tidak valid";
    return false;
  }

  uint8_t blockhash[32];
  if (!getLatestBlockhash(blockhash, err)) return false;

  uint8_t memoProgram[32];
  if (!b58decode(MEMO_PROGRAM_ID, memoProgram, 32)) {
    err = "base58 memo program";
    return false;
  }

  // Message Solana:
  // header [1,0,1] + 2 account keys + blockhash + 1 instruction
  uint8_t message[900];
  size_t m = 0;

  message[m++] = 1;  // num required signatures
  message[m++] = 0;  // num readonly signed accounts
  message[m++] = 1;  // num readonly unsigned accounts (memo program)

  message[m++] = 2;  // jumlah account keys
  memcpy(message + m, pub, 32); m += 32;          // fee payer
  memcpy(message + m, memoProgram, 32); m += 32;  // memo program
  memcpy(message + m, blockhash, 32); m += 32;    // recent blockhash

  message[m++] = 1;  // jumlah instruction
  message[m++] = 1;  // program id index = memo program
  message[m++] = 0;  // jumlah account index untuk memo (0)

  size_t memoLen = memo.length();
  m += writeShortVec(message + m, memoLen);

  if (m + memoLen > sizeof(message)) {
    err = "message overflow";
    return false;
  }

  memcpy(message + m, memo.c_str(), memoLen);
  m += memoLen;

  uint8_t signatureBytes[64];
  ed25519_sign(signatureBytes, message, m, pub, priv);

  uint8_t tx[1200];
  size_t t = 0;

  tx[t++] = 1;  // jumlah signature
  memcpy(tx + t, signatureBytes, 64); t += 64;

  if (t + m > sizeof(tx)) {
    err = "tx overflow";
    return false;
  }

  memcpy(tx + t, message, m);
  t += m;

  if (t > 1232) {
    err = "tx > 1232 bytes";
    return false;
  }

  return sendTransaction(tx, t, signature, err);
}

// ---------------- SETUP / LOOP ----------------
void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println();
  Serial.println("=== ESP32 -> Solana Memo v2 ===");

  dht.begin();
  analogReadResolution(12);

  initWallet();
  connectWiFi();
  syncTime();

  Serial.println("[info] mengirim data setiap 60 detik");
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[wifi] belum tersambung, coba lagi");
    delay(10000);
    return;
  }

  SensorData d = readSensors();
  String memo = buildMemo(d);

  if (memo.length() == 0) {
    Serial.println("[err] memo gagal dibuat");
    delay(10000);
    return;
  }

  Serial.print("[memo] ");
  Serial.println(memo);

  String signature;
  String err;

  if (sendMemo(memo, signature, err)) {
    Serial.print("[ok] signature: ");
    Serial.println(signature);
    Serial.print("[ok] explorer: https://explorer.solana.com/tx/");
    Serial.print(signature);
    Serial.println("?cluster=devnet");
  } else {
    Serial.print("[err] ");
    Serial.println(err);
  }

  delay(60000);
}
```

## 6. Instalasi library Ed25519

Kode memakai API `orlp/ed25519`:

```cpp
ed25519_create_keypair(pub, priv, seed);
ed25519_sign(signature, message, message_len, pub, priv);
```

Langkah PlatformIO:

```bash
git clone https://github.com/orlp/ed25519.git
mkdir -p lib/ed25519/src
# copy isi src/ ke lib/ed25519/src/
```

Buat `lib/ed25519/library.json`:

```json
{
  "name": "ed25519",
  "version": "0.0.1",
  "build": {
    "srcDir": "src",
    "includeDir": "src"
  }
}
```

Jika `randombytes.c` gagal dikompilasi di ESP32, keluarkan file itu dari build. Kode ini hanya memakai `ed25519_create_keypair()` dan `ed25519_sign()`, yang tidak membutuhkan `randombytes`.

## 7. platformio.ini

```ini
[env:esp32dev]
platform = espressif32
board = esp32dev
framework = arduino
monitor_speed = 115200

lib_deps =
  bblanchon/ArduinoJson@^7.0.0
  adafruit/DHT sensor library@^1.4.6
  adafruit/Adafruit Unified Sensor@^1.1.14
```

Untuk ESP32-S3, ganti `board` sesuai board yang dipakai.

## 8. Setup dan uji devnet

1. Isi `WIFI_SSID`, `WIFI_PASSWORD`, `DEVICE_ID`, dan `BATCH_ID`.
2. Untuk uji tanpa sensor, set `#define USE_DUMMY_SENSORS 1`.
3. Flash dan buka Serial Monitor 115200.
4. Catat `[wallet] pubkey: ...` yang muncul.
5. Fund wallet devnet:

```bash
solana airdrop 1 <PUBKEY> --url devnet
solana balance <PUBKEY> --url devnet
```

Atau pakai faucet web Solana Devnet.

6. Tunggu loop berikutnya. Serial akan menampilkan signature dan URL explorer.
7. Buka:

```text
https://explorer.solana.com/tx/<SIGNATURE>?cluster=devnet
```

8. Cek log memo:

```bash
solana confirm -v <SIGNATURE> --url devnet
```

Di log akan terlihat `Program log: Memo (len ...): "GARAM|..."`.

### Kalau ingin tanpa RPC hosted

Jalankan RPC/validator Solana di PC/LAN, lalu:

```cpp
#define USE_TLS 0
#define RPC_URL "http://192.168.1.50:8899"
```

Ini menghilangkan layanan RPC pihak ketiga, tetapi ESP32 tetap bukan validator dan tetap bergantung pada node RPC lokal. Jangan pakai HTTP polos di jaringan publik.

### TLS certificate untuk produksi

Ganti `client.setInsecure()` dengan CA certificate:

```cpp
static const char SOLANA_CA[] = R"EOF(
-----BEGIN CERTIFICATE-----
... isi root CA ...
-----END CERTIFICATE-----
)EOF";

WiFiClientSecure client;
client.setCACert(SOLANA_CA);
```

Ambil chain certificate dari endpoint RPC, lalu pilih root CA yang sesuai. Verifikasi ulang saat provider mengganti certificate.

## 9. Kalau butuh aturan bisnis on-chain

Memo hanya mencatat. Untuk verifikasi garam yang serius, buat program Solana (misalnya Anchor) dengan:

- PDA per batch: `["batch", batch_id]`;
- registry perangkat: `["device", device_pubkey]`;
- instruksi `record_sensor(device, batch_id, payload_hash, timestamp, nonce)`;
- penolakan batch duplikat/nonce berulang;
- role verifikator yang harus menandatangani approval;
- event yang bisa dibaca indexer/aplikasi.

ESP32 kemudian mengirim instruksi program, bukan memo. Itu lebih kompleks karena perlu serialisasi Borsh/instruction discriminator, tetapi tetap bisa dilakukan tanpa bridge/backend.

### Menghubungkan ke aplikasi verifikasi garam

Aplikasi Next.js saat ini belum membaca Solana; ia menyimpan bukti simulasi di browser. Agar terhubung:

1. Simpan signature dari ESP32 sebagai bukti batch (di aplikasi, field `txHash` saat ini sebenarnya berisi signature, bukan transaction hash).
2. Tambahkan mode bukti baru, misalnya `iot-devnet`, agar tidak tercampur dengan mode `phantom`/`simulasi`.
3. Tambahkan pembacaan RPC/indexer untuk mencocokkan memo dengan `batchId`, `deviceId`, dan hash.
4. Tampilkan tautan explorer dan status konfirmasi, bukan hanya signature mentah.
5. Jangan menganggap memo sebagai pengganti approval komunitas; memo adalah attestation perangkat.

## 10. Keterbatasan

- **RPC tetap pihak ketiga** jika memakai `api.devnet.solana.com`. Ini bukan bridge, tetapi tetap layanan hosted. RPC bisa menolak/censor request atau memberi status yang salah; signature transaksi tetap tidak bisa dipalsukan tanpa private key. Untuk no-cloud, pakai RPC lokal.
- **Private key ada di ESP32**. Physical access = potential key access. Gunakan wallet khusus dan saldo kecil.
- **TLS `setInsecure()` tidak aman** untuk produksi. Ganti dengan CA certificate/pinning.
- **Sensor tidak otomatis benar**. Tanda tangan membuktikan perangkat, bukan kualitas garam. Probe murah tidak menggantikan lab.
- **Memo bukan smart contract**. Tidak ada penolakan duplikat atau aturan verifikator.
- **Belum ada konfirmasi final**. `sendTransaction` mengembalikan **signature**, bukan transaction hash. Explorer memakai signature tersebut; kode belum polling status final.
- **Blockhash cepat kedaluwarsa**. Jika transaksi gagal, loop berikutnya akan mencoba lagi.
- **Batas transaksi 1232 byte**. Memo dibatasi 500 byte di kode ini.
- **RPC rate limit** bisa menolak request; di produksi perlu backoff dan monitoring.
- **RAM/stack**. TLS + Ed25519 + JSON bisa memakai puluhan KB. Jika board reboot saat signing/TLS, naikkan stack task atau pakai ESP32-S3 dengan PSRAM.
- **Kode belum diuji hardware**. Periksa library Ed25519 dan TLS di board sebelum dipakai.

## 11. Checklist sebelum produksi

- [ ] Ganti `setInsecure()` dengan CA certificate.
- [ ] Aktifkan secure boot, flash encryption, dan NVS encryption.
- [ ] Gunakan wallet perangkat dengan saldo minimum.
- [ ] Tambahkan watchdog dan retry/backoff.
- [ ] Tambahkan penyimpanan lokal saat WiFi mati.
- [ ] Validasi nonce/timestamp di sisi penerima.
- [ ] Ganti memo dengan program on-chain untuk aturan batch.
- [ ] Kalibrasi sensor dan dokumentasikan metode ukur.
- [ ] Uji di devnet, lalu testnet, sebelum mainnet.
- [ ] Buat indexer yang membaca memo/event dan menghubungkannya ke aplikasi verifikasi garam.

## 12. Ringkasan

Secara teknis, ESP32 **bisa** membangun, menandatangani, dan mengirim transaksi Solana sendiri tanpa bridge atau backend cloud. Yang tidak bisa dihilangkan adalah **RPC node**: ESP32 tetap perlu koneksi ke node Solana. Jadi arsitektur yang benar adalah:

```text
ESP32 → RPC Solana → validator
```

bukan:

```text
ESP32 → backend/bridge → Solana
```
