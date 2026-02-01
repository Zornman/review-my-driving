import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class SharedService {
    constructor() {}

    generateTruckId(): string {
        const c = globalThis.crypto as Crypto | undefined;
      
        if (c?.randomUUID) {
          return `T-${c.randomUUID()}`;
        }
      
        if (c?.getRandomValues) {
          const buf = new Uint8Array(16);
          c.getRandomValues(buf);
          buf[6] = (buf[6] & 0x0f) | 0x40; // version 4
          buf[8] = (buf[8] & 0x3f) | 0x80; // variant 10
          const hex = Array.from(buf, b => b.toString(16).padStart(2, '0')).join('');
          const uuid = `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
          return `T-${uuid}`;
        }
      
        // Last-resort fallback (older environments)
        const time = Date.now().toString(36);
        const rand = Math.random().toString(36).slice(2);
        return `T-${time}-${rand}`;
    }

    generateDriverId(): string {
        const c = globalThis.crypto as Crypto | undefined;

        if (c?.randomUUID) {
          return `D-${c.randomUUID()}`;
        }

        if (c?.getRandomValues) {
          const buf = new Uint8Array(16);
          c.getRandomValues(buf);
          buf[6] = (buf[6] & 0x0f) | 0x40; // version 4
          buf[8] = (buf[8] & 0x3f) | 0x80; // variant 10
          const hex = Array.from(buf, b => b.toString(16).padStart(2, '0')).join('');
          const uuid = `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
          return `D-${uuid}`;
        }

        // Last-resort fallback (older environments)
        const time = Date.now().toString(36);
        const rand = Math.random().toString(36).slice(2);
        return `D-${time}-${rand}`;
    }
}