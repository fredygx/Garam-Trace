export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export function shortAddress(address?: string | null, chars = 4) {
  if (!address) return "—";
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}…${address.slice(-chars)}`;
}

export function shortHash(hash?: string | null, chars = 8) {
  if (!hash) return "—";
  if (hash.length <= chars * 2 + 3) return hash;
  return `${hash.slice(0, chars)}…${hash.slice(-chars)}`;
}

const dateTimeFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Jakarta",
});

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});

export function formatDateTime(iso?: string | null) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return dateTimeFormatter.format(date);
}

export function formatTanggal(iso?: string | null) {
  if (!iso) return "—";
  const date = new Date(`${iso}T00:00:00+07:00`);
  if (Number.isNaN(date.getTime())) {
    const fallback = new Date(iso);
    if (Number.isNaN(fallback.getTime())) return "—";
    return dateFormatter.format(fallback);
  }
  return dateFormatter.format(date);
}

export function formatAngka(value: number, digits = 1) {
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatPersen(value: number, digits = 1) {
  return `${formatAngka(value, digits)}%`;
}

export async function sha256Hex(input: string | ArrayBuffer | Uint8Array) {
  let data: Uint8Array<ArrayBuffer>;
  if (typeof input === "string") {
    data = new TextEncoder().encode(input) as Uint8Array<ArrayBuffer>;
  } else if (input instanceof Uint8Array) {
    data = new Uint8Array(input.byteLength);
    data.set(input);
  } else {
    data = new Uint8Array(input);
  }
  const digest = await crypto.subtle.digest("SHA-256", data.buffer);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function hexToBytes(hex: string) {
  const clean = hex.length % 2 === 0 ? hex : `0${hex}`;
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Number.parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

const BASE58_ALPHABET =
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

export function base58Encode(bytes: Uint8Array) {
  if (bytes.length === 0) return "";
  const digits: number[] = [0];
  for (const byte of bytes) {
    let carry = byte;
    for (let i = 0; i < digits.length; i += 1) {
      const value = digits[i] * 256 + carry;
      digits[i] = value % 58;
      carry = Math.floor(value / 58);
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = Math.floor(carry / 58);
    }
  }
  let result = "";
  for (const byte of bytes) {
    if (byte === 0) result += BASE58_ALPHABET[0];
    else break;
  }
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    result += BASE58_ALPHABET[digits[i]];
  }
  return result;
}

export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value) ?? "null";
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record)
    .filter((key) => record[key] !== undefined)
    .sort();
  return `{${keys
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(",")}}`;
}

export async function fileToDataUrl(file: File, maxDimension = 900) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Gagal membaca berkas gambar."));
    reader.onload = () => {
      const source = String(reader.result);
      const image = new Image();
      image.onerror = () => resolve(source);
      image.onload = () => {
        const scale = Math.min(
          1,
          maxDimension / Math.max(image.width, image.height),
        );
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");
        if (!context) {
          resolve(source);
          return;
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      image.src = source;
    };
    reader.readAsDataURL(file);
  });
}

export function generateBatchId(prefix = "GRM") {
  const now = new Date();
  const year = now.getFullYear();
  const serial = Math.floor(100 + Math.random() * 900);
  return `${prefix}-${year}-${serial}`;
}

export function todayIso() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 10);
}

export function buildTraceUrl(origin: string, batchId: string) {
  const base = origin || "";
  return `${base}/?batch=${encodeURIComponent(batchId)}&tab=konsumen`;
}
