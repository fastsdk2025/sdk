import { resolveTxt } from "node:dns/promises";
import { BufferLike } from "./types";
import { da } from "zod/v4/locales";

export function isBuffer(buffer: unknown): buffer is Buffer  {
  return (
    typeof buffer !== "undefined" &&
    Buffer.isBuffer(buffer)
  )
}

export function isArrayBuffer(buffer: unknown): buffer is ArrayBuffer {
  return buffer instanceof ArrayBuffer;
}

export function isSharedArrayBuffer(buffer: unknown): buffer is SharedArrayBuffer {
  return buffer instanceof SharedArrayBuffer;
}

export function isUint8Array(buffer: unknown): buffer is Uint8Array {
  return buffer instanceof Uint8Array;
}

export function isDataView(buffer: unknown): buffer is DataView {
  return buffer instanceof DataView;
}

export function toUint8Array(data: BufferLike): Uint8Array {
  if (isBuffer(data)) {
    return new Uint8Array(
      data.buffer,
      data.byteOffset,
      data.byteLength
    )
  }

  if (isUint8Array(data)) {
    return data;
  }

  if (isArrayBuffer(data) || isSharedArrayBuffer(data)) {
    return new Uint8Array(data);
  }

  if (isDataView(data)) {
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  }

  throw new TypeError("Unsupported BufferLike type");
}

export function toArrayBuffer(data: BufferLike): ArrayBuffer {
  if (isArrayBuffer(data)) {
    return data;
  }

  if (isSharedArrayBuffer(data)) {
    return data as unknown as ArrayBuffer;
  }

  if (isBuffer(data) || isUint8Array(data) || isDataView(data)) {
    return data.buffer.slice(
      data.byteOffset,
      data.byteOffset + data.byteLength
    ) as ArrayBuffer
  }

  throw new TypeError("Unsupported BufferLike type");
}

export function toBuffer(data: BufferLike) {
  if (isBuffer(data)) {
    return data;
  }

  if (isArrayBuffer(data) || isSharedArrayBuffer(data)) {
    return Buffer.from(new Uint8Array(data))
  }

  if (isUint8Array(data)) {
    return Buffer.from(data);
  }

  if (isDataView(data)) {
    return Buffer.from(toUint8Array(data));
  }

  throw new TypeError("Unsupported BufferLike type");
}

export function getByteLength(data: BufferLike): number {
  if (isBuffer(data) || isUint8Array(data)) {
    return data.byteLength;
  }

  if (isArrayBuffer(data) || isSharedArrayBuffer(data)) {
    return data.byteLength;
  }

  if (isDataView(data)) {
    return data.byteLength;
  }

  throw new TypeError("Unsupported BufferLike type");
}
