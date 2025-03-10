import { __decorate, __param } from "tslib";
import { Injectable, PLATFORM_ID, Inject } from "@angular/core";
import { isPlatformBrowser } from '@angular/common';
let ThemeService = class ThemeService {
    platformId;
    windowRef;
    darkThemeClass = 'dark-mode';
    lightThemeClass = 'light-mode';
    themeKey = 'user-theme'; // LocalStorage key
    isDarkMode;
    constructor(platformId, windowRef) {
        this.platformId = platformId;
        this.windowRef = windowRef;
        this.setInitialTheme();
    }
    /** ✅ Get current dark mode status */
    getIsDarkMode() {
        return this.isDarkMode;
    }
    /** ✅ Initialize theme based on localStorage or system preference */
    setInitialTheme() {
        const win = this.windowRef.nativeWindow;
        if (win) {
            let savedTheme = null;
            if (isPlatformBrowser(this.platformId)) {
                savedTheme = localStorage.getItem(this.themeKey);
            }
            if (savedTheme) {
                // Load user preference from localStorage
                this.isDarkMode = savedTheme === this.darkThemeClass;
            }
            else {
                // If no saved theme, follow system preference
                this.isDarkMode = win.matchMedia('(prefers-color-scheme: dark)').matches;
            }
            this.applyTheme(this.isDarkMode ? this.darkThemeClass : this.lightThemeClass);
        }
    }
    /** ✅ Toggle dark/light mode and persist preference */
    toggleTheme(isDarkMode) {
        this.isDarkMode = isDarkMode;
        if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem(this.themeKey, isDarkMode ? this.darkThemeClass : this.lightThemeClass);
        }
        this.applyTheme(isDarkMode ? this.darkThemeClass : this.lightThemeClass);
    }
    /** ✅ Apply the selected theme to the body */
    applyTheme(themeClass) {
        const body = document.body;
        body.classList.remove(this.darkThemeClass, this.lightThemeClass);
        body.classList.add(themeClass);
    }
};
ThemeService = __decorate([
    Injectable({
        providedIn: 'root'
    }),
    __param(0, Inject(PLATFORM_ID))
], ThemeService);
export { ThemeService };
