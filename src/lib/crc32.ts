/**
 * CRC-32 Checksum Utility
 *
 * Fully compliant with:
 *  - IEEE 802.3 (Ethernet FCS)
 *  - ISO 3309
 *  - ITU-T V.42
 *
 * Polynomial  : 0x04C11DB7  (reflected → 0xEDB88320)
 * Init value  : 0xFFFFFFFF
 * Reflect in  : true
 * Reflect out : true
 * Final XOR   : 0xFFFFFFFF
 */

// ─── Types ────────────────────────────────────────────────────────────────────

/** Any value that can be checksummed. */
export type CRC32Input =
  | unknown // plain JS values  → deterministic JSON → UTF-8 bytes
  | ArrayBuffer // hashed raw
  | ArrayBufferView; // Uint8Array / Int16Array / Buffer / etc. — hashed raw

/** Shape returned by {@link CRC32.digest}. */
export interface CRC32Digest {
  /** Unsigned 32-bit integer (0 – 4 294 967 295). */
  value: number;
  /** 8-character uppercase hex string, e.g. `"0D4A1185"`. */
  hex: string;
  /** Signed 32-bit integer representation (matches languages that use int32). */
  signed: number;
}

// ─── CRC32 class ─────────────────────────────────────────────────────────────

/**
 * IEEE 802.3 CRC-32 calculator.
 *
 * ### One-shot usage (static helpers)
 * ```ts
 * CRC32.hash("hello world").hex   // "0D4A1185"
 * CRC32.hashValue({ a: 1 }).value // 2420501879
 * ```
 *
 * ### Streaming / chunked usage (instance)
 * ```ts
 * const crc = new CRC32();
 * crc.update(chunk1).update(chunk2);
 * const result = crc.digest();     // CRC32Digest
 * crc.reset();                     // reuse
 * ```
 */
export class CRC32 {
  // ── Private state ──────────────────────────────────────────────────────────

  /** Running CRC state (pre-final-XOR). Initialised to 0xFFFFFFFF per spec. */
  private _state: number = 0xffffffff;

  /** Shared TextEncoder — re-used across all calls to avoid repeated allocation. */
  private static readonly _encoder = new TextEncoder();

  /**
   * Pre-computed 256-entry lookup table for the reflected polynomial
   * 0xEDB88320 (bit-reversal of the canonical 0x04C11DB7).
   * Built once at class-definition time.
   */
  private static readonly _table: Uint32Array = CRC32._build_table();

  // ── Table builder ──────────────────────────────────────────────────────────

  private static _build_table(): Uint32Array {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) {
        c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
      }
      table[i] = c >>> 0;
    }
    return table;
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  /**
   * Normalise any supported input type into a Uint8Array.
   * Binary views are wrapped zero-copy; everything else is serialised
   * to deterministic JSON and encoded as UTF-8.
   */
  private static _to_bytes(value: CRC32Input): Uint8Array {
    if (value instanceof Uint8Array) {
      return value;
    }

    if (value instanceof ArrayBuffer) {
      return new Uint8Array(value);
    }

    if (ArrayBuffer.isView(value)) {
      // Covers Int8Array, Float64Array, Node.js Buffer, etc.
      return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
    }

    // Deterministic JSON: sort object keys so { b:2, a:1 } === { a:1, b:2 }
    const json = JSON.stringify(value, (_key, val) => {
      if (val !== null && typeof val === "object" && !Array.isArray(val)) {
        return Object.keys(val as object)
          .sort()
          .reduce<Record<string, unknown>>((acc, k) => {
            // eslint-disable-next-line no-param-reassign
            acc[k] = (val as Record<string, unknown>)[k];
            return acc;
          }, {});
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return val;
    });

    // JSON.stringify returns undefined for functions / symbols / undefined itself
    return CRC32._encoder.encode(json ?? String(value));
  }

  /**
   * Core table-driven CRC update over a byte array.
   * Processes one byte per iteration using the reflected algorithm.
   */
  private static _update(crc: number, bytes: Uint8Array): number {
    let c = crc >>> 0;
    const table = CRC32._table;
    for (let i = 0; i < bytes.length; i++) {
      c = (c >>> 8) ^ table[(c ^ bytes[i]) & 0xff];
    }
    return c >>> 0;
  }

  /** Apply the final XOR mask and coerce to unsigned 32-bit. */
  private static _finalise(state: number): number {
    return (state ^ 0xffffffff) >>> 0;
  }

  /** Build the CRC32Digest object from a raw (pre-final-XOR) state. */
  private static _build_digest(state: number): CRC32Digest {
    const value = CRC32._finalise(state);
    return {
      value,
      hex: value.toString(16).toUpperCase().padStart(8, "0"),
      signed: value | 0, // reinterpret as int32
    };
  }

  // ── Instance (streaming) API ───────────────────────────────────────────────

  /**
   * Feed a chunk of data into the running checksum.
   * Accepts raw bytes (Uint8Array) or a UTF-8 string.
   *
   * @returns `this` — calls are chainable.
   *
   * @example
   * const crc = new CRC32();
   * crc.update("foo").update("bar").digest().hex; // "9EF61F95"
   */
  public update(chunk: Uint8Array | string): this {
    const bytes =
      typeof chunk === "string" ? CRC32._encoder.encode(chunk) : chunk;
    this._state = CRC32._update(this._state, bytes);
    return this;
  }

  /**
   * Finalise and return the digest without resetting state.
   * Call reset() explicitly if you want to reuse this instance.
   */
  public digest(): CRC32Digest {
    return CRC32._build_digest(this._state);
  }

  /**
   * Reset internal state back to the IEEE initial value 0xFFFFFFFF.
   * @returns `this` — chainable.
   */
  public reset(): this {
    this._state = 0xffffffff;
    return this;
  }

  // ── Static (one-shot) API ──────────────────────────────────────────────────

  /**
   * One-shot checksum of raw bytes or a UTF-8 string.
   * For objects and other JS values use hashValue().
   *
   * @example
   * CRC32.hash("hello world").hex   // "0D4A1185"
   * CRC32.hash("hello world").value // 222957957
   */
  public static hash(input: Uint8Array | string): CRC32Digest {
    const bytes =
      typeof input === "string" ? CRC32._encoder.encode(input) : input;
    const raw = CRC32._update(0xffffffff, bytes);
    return CRC32._build_digest(raw);
  }

  /**
   * One-shot checksum of any JavaScript / TypeScript value.
   *
   * - Plain objects  → deterministically serialised (keys sorted) → UTF-8
   * - ArrayBuffer / TypedArray / Buffer → raw bytes
   * - Primitives     → JSON.stringify → UTF-8
   *
   * @example
   * CRC32.hashValue(42).hex                          // "2961F11F"
   * CRC32.hashValue({ b: 2, a: 1 }).value            // same as { a:1, b:2 }
   * CRC32.hashValue(new Uint8Array([0x01, 0x02])).hex // raw-byte checksum
   */
  public static hash_value(value: CRC32Input): CRC32Digest {
    const bytes = CRC32._to_bytes(value);
    const raw = CRC32._update(0xffffffff, bytes);
    return CRC32._build_digest(raw);
  }

  /**
   * Combine multiple values into a single checksum in one call.
   * Values are serialised and concatenated before hashing —
   * equivalent to streaming them one-by-one via update().
   *
   * @example
   * CRC32.combine("foo", "bar").hex === new CRC32().update("foo").update("bar").digest().hex
   * // → true
   */
  public static combine(...values: (Uint8Array | string)[]): CRC32Digest {
    const instance = new CRC32();
    for (const v of values) {
      instance.update(v);
    }
    return instance.digest();
  }

  /**
   * Verify that a value produces the expected checksum.
   *
   * @param value    Any value accepted by hashValue().
   * @param expected The expected CRC — number, signed int32, or hex string.
   * @returns true if the checksums match.
   *
   * @example
   * CRC32.verify("hello world", "0D4A1185") // true
   * CRC32.verify("hello world", 222957957)  // true
   */
  public static verify(value: CRC32Input, expected: number | string): boolean {
    const digest = CRC32.hash_value(value);
    if (typeof expected === "number") {
      // Accept both unsigned and signed representations
      return (
        digest.value === expected >>> 0 || digest.signed === (expected | 0)
      );
    }
    return digest.hex === expected.toUpperCase().padStart(8, "0");
  }
}
