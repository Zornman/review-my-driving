import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class SharedService {
    constructor() {}

  private readonly CROCKFORD_BASE32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

  /**
   * Generates a short, human-friendly identifier using Crockford Base32 (no I/L/O/U).
   * Example (len=8): "7P4K2N9D"
   */
  private randomBase32(length: number): string {
    const alphabet = this.CROCKFORD_BASE32;
    const cryptoObj = globalThis.crypto as Crypto | undefined;

    // Prefer cryptographically strong randomness when available.
    if (cryptoObj?.getRandomValues) {
      // Each Base32 char uses 5 bits.
      const totalBits = length * 5;
      const totalBytes = Math.ceil(totalBits / 8);
      const bytes = new Uint8Array(totalBytes);
      cryptoObj.getRandomValues(bytes);

      let out = '';
      let bitBuffer = 0;
      let bitsInBuffer = 0;

      for (const b of bytes) {
        bitBuffer = (bitBuffer << 8) | b;
        bitsInBuffer += 8;

        while (bitsInBuffer >= 5 && out.length < length) {
          const shift = bitsInBuffer - 5;
          const idx = (bitBuffer >> shift) & 31;
          out += alphabet[idx];
          bitsInBuffer -= 5;
          bitBuffer = bitBuffer & ((1 << bitsInBuffer) - 1);
        }

        if (out.length >= length) break;
      }

      // If we somehow didn't fill (extremely unlikely), pad with a fallback.
      while (out.length < length) {
        out += alphabet[Math.floor(Math.random() * alphabet.length)];
      }

      return out;
    }

    // Last-resort fallback (older environments)
    const time = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).slice(2).toUpperCase();
    const raw = (time + rand).replace(/[^0-9A-Z]/g, '');
    return raw.slice(0, length).padEnd(length, '0');
  }

  generateTruckId(): string {
    // 8 chars => ~40 bits; readable and very low collision risk.
    return `T-${this.randomBase32(8)}`;
  }

  generateDriverId(): string {
    return `D-${this.randomBase32(8)}`;
  }
}