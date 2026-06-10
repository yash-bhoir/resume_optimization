export interface SessionBinary {
  originalBlob?: Blob;
  originalFileName?: string;
  originalFileBase64?: string;
  preservedDocxBase64?: string;
  preservedTexSource?: string;
}

const DB_NAME = "resume-optimizer";
const STORE_NAME = "files";
const BINARY_KEY = "current";
const LEGACY_SESSION_KEY = "resume_optimizer_binary";

let memoryOriginalFile: File | null = null;

export function cacheOriginalUploadFile(file: File | null): void {
  memoryOriginalFile = file;
}

export function getCachedOriginalUploadFile(): File | null {
  return memoryOriginalFile;
}

function pickDefinedBinary(data: SessionBinary): SessionBinary {
  const out: SessionBinary = {};
  if (data.originalBlob !== undefined) out.originalBlob = data.originalBlob;
  if (data.originalFileName !== undefined) out.originalFileName = data.originalFileName;
  if (data.originalFileBase64 !== undefined) out.originalFileBase64 = data.originalFileBase64;
  if (data.preservedDocxBase64 !== undefined) out.preservedDocxBase64 = data.preservedDocxBase64;
  if (data.preservedTexSource !== undefined) out.preservedTexSource = data.preservedTexSource;
  return out;
}

function hasBinaryPayload(data: SessionBinary): boolean {
  return Boolean(
    data.originalBlob ||
      data.originalFileBase64 ||
      data.preservedDocxBase64 ||
      data.preservedTexSource ||
      data.originalFileName
  );
}

function uint8ToBase64(bytes: Uint8Array): string {
  const chunkSize = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  return btoa(binary);
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function writeBinary(data: SessionBinary): Promise<boolean> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put(data, BINARY_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
    return true;
  } catch {
    return false;
  }
}

export async function saveOriginalUploadFile(file: File): Promise<boolean> {
  if (typeof window === "undefined") return false;
  cacheOriginalUploadFile(file);

  const existing = await loadSessionBinary();
  const saved = await writeBinary({
    ...existing,
    originalBlob: file,
    originalFileName: file.name,
  });

  if (saved) return true;

  try {
    const buffer = await file.arrayBuffer();
    return writeBinary({
      ...existing,
      originalFileBase64: uint8ToBase64(new Uint8Array(buffer)),
      originalFileName: file.name,
    });
  } catch {
    return false;
  }
}

export async function saveSessionBinary(data: SessionBinary): Promise<boolean> {
  if (typeof window === "undefined") return false;

  const patch = pickDefinedBinary(data);
  if (!hasBinaryPayload(patch)) {
    return true;
  }

  const existing = await loadSessionBinary();
  const merged: SessionBinary = {
    ...existing,
    ...patch,
    originalFileName: patch.originalFileName || existing.originalFileName,
  };

  const saved = await writeBinary(merged);
  if (saved) {
    try {
      sessionStorage.removeItem(LEGACY_SESSION_KEY);
    } catch {
      /* ignore */
    }
    return true;
  }

  try {
    const legacy: SessionBinary = { ...merged };
    delete legacy.originalBlob;
    sessionStorage.setItem(LEGACY_SESSION_KEY, JSON.stringify(legacy));
    return true;
  } catch {
    return false;
  }
}

export async function loadSessionBinary(): Promise<SessionBinary> {
  if (typeof window === "undefined") return {};

  try {
    const db = await openDb();
    const data = await new Promise<SessionBinary | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).get(BINARY_KEY);
      req.onsuccess = () => resolve(req.result as SessionBinary | undefined);
      req.onerror = () => reject(req.error);
    });
    db.close();
    if (data && (data.originalBlob || data.originalFileBase64 || data.preservedDocxBase64)) {
      return data;
    }
  } catch {
    /* ignore */
  }

  try {
    const raw = sessionStorage.getItem(LEGACY_SESSION_KEY);
    if (raw) return JSON.parse(raw) as SessionBinary;
  } catch {
    /* ignore */
  }

  return {};
}

export async function loadOriginalUploadBlob(): Promise<{
  blob: Blob;
  fileName?: string;
} | null> {
  const cached = getCachedOriginalUploadFile();
  if (cached) {
    return { blob: cached, fileName: cached.name };
  }

  const data = await loadSessionBinary();
  if (data.originalBlob) {
    return { blob: data.originalBlob, fileName: data.originalFileName };
  }

  if (data.originalFileBase64) {
    const mime = data.originalFileName?.toLowerCase().endsWith(".docx")
      ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      : "application/pdf";
    const binary = atob(data.originalFileBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return {
      blob: new Blob([bytes], { type: mime }),
      fileName: data.originalFileName,
    };
  }

  return null;
}

export async function clearSessionBinary(): Promise<void> {
  memoryOriginalFile = null;
  if (typeof window === "undefined") return;

  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(BINARY_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    /* ignore */
  }

  try {
    sessionStorage.removeItem(LEGACY_SESSION_KEY);
  } catch {
    /* ignore */
  }
}
