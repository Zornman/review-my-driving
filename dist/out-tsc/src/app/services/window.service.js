import { __decorate } from "tslib";
import { Injectable } from "@angular/core";
let WindowRefService = class WindowRefService {
    get nativeWindow() {
        return typeof window !== 'undefined' ? window : null;
    }
};
WindowRefService = __decorate([
    Injectable({
        providedIn: 'root'
    })
], WindowRefService);
export { WindowRefService };
