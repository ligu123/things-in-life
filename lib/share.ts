import type { Todo } from "./types";

const SHARE_PREFIX = "share=";
const MAX_TODOS = 1500;
const MAX_DECODED_BYTES = 100 * 1024;

type SharePayload = {
  v: 1;
  todos: Todo[];
};

export type ParseShareResult =
  | { status: "none" }
  | { status: "ok"; todos: Todo[] }
  | { status: "error"; message: string };

function isTodo(value: unknown): value is Todo {
  if (typeof value !== "object" || value === null) return false;

  const todo = value as Record<string, unknown>;
  return (
    typeof todo.id === "string" &&
    typeof todo.text === "string" &&
    typeof todo.completed === "boolean" &&
    typeof todo.createdAt === "number"
  );
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad =
    padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function canCompress(): boolean {
  return (
    typeof CompressionStream !== "undefined" &&
    typeof DecompressionStream !== "undefined"
  );
}

async function readStream(
  stream: ReadableStream<Uint8Array>,
): Promise<Uint8Array> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    chunks.push(value);
    total += value.length;
  }

  const result = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

async function compressBytes(bytes: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer])
    .stream()
    .pipeThrough(new CompressionStream("deflate-raw"));
  return readStream(stream);
}

async function decompressBytes(bytes: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer])
    .stream()
    .pipeThrough(new DecompressionStream("deflate-raw"));
  return readStream(stream);
}

function parsePayloadJson(json: string): Todo[] {
  if (json.length > MAX_DECODED_BYTES) {
    throw new Error("Shared list is too large.");
  }

  const parsed: unknown = JSON.parse(json);
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("Shared list is invalid.");
  }

  const record = parsed as Record<string, unknown>;
  if (record.v !== 1 || !Array.isArray(record.todos)) {
    throw new Error("Shared list is invalid.");
  }

  if (record.todos.length > MAX_TODOS) {
    throw new Error("Shared list is too large.");
  }

  const todos = record.todos.filter(isTodo);
  if (todos.length !== record.todos.length) {
    throw new Error("Shared list is invalid.");
  }

  return todos;
}

export async function encodeSharePayload(todos: Todo[]): Promise<string> {
  if (todos.length > MAX_TODOS) {
    throw new Error("List is too large to share.");
  }

  const payload: SharePayload = { v: 1, todos };
  const json = JSON.stringify(payload);
  if (json.length > MAX_DECODED_BYTES) {
    throw new Error("List is too large to share.");
  }

  const bytes = new TextEncoder().encode(json);

  if (canCompress()) {
    try {
      const compressed = await compressBytes(bytes);
      return `c.${toBase64Url(compressed)}`;
    } catch {
      // Fall through to uncompressed
    }
  }

  return `u.${toBase64Url(bytes)}`;
}

export async function decodeSharePayload(raw: string): Promise<Todo[]> {
  if (!raw) {
    throw new Error("Shared list is invalid.");
  }

  const mode = raw.startsWith("c.") || raw.startsWith("u.") ? raw.slice(0, 1) : null;
  const encoded = mode ? raw.slice(2) : raw;
  const bytes = fromBase64Url(encoded);

  let jsonBytes = bytes;
  if (mode === "c") {
    jsonBytes = await decompressBytes(bytes);
  } else if (mode === null && canCompress()) {
    try {
      jsonBytes = await decompressBytes(bytes);
    } catch {
      jsonBytes = bytes;
    }
  }

  if (jsonBytes.length > MAX_DECODED_BYTES) {
    throw new Error("Shared list is too large.");
  }

  return parsePayloadJson(new TextDecoder().decode(jsonBytes));
}

export async function buildShareUrl(todos: Todo[]): Promise<string> {
  const payload = await encodeSharePayload(todos);
  const url = new URL(window.location.href);
  url.hash = `${SHARE_PREFIX}${payload}`;
  return url.toString();
}

export function getShareHashRaw(): string | null {
  if (typeof window === "undefined") return null;

  const hash = window.location.hash.replace(/^#/, "");
  if (!hash.startsWith(SHARE_PREFIX)) return null;
  return hash.slice(SHARE_PREFIX.length);
}

export async function parseShareHash(): Promise<ParseShareResult> {
  const raw = getShareHashRaw();
  if (raw === null) return { status: "none" };

  try {
    const todos = await decodeSharePayload(raw);
    return { status: "ok", todos };
  } catch {
    return { status: "error", message: "Couldn't read this shared list." };
  }
}

export function clearShareHash(): void {
  if (typeof window === "undefined") return;

  const { pathname, search } = window.location;
  window.history.replaceState(null, "", `${pathname}${search}`);
}
