import { Injectable, PLATFORM_ID, Inject } from "@angular/core";
import { isPlatformBrowser } from '@angular/common';
import { WindowRefService } from "./window.service";

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    private darkThemeClass = 'dark-mode';
    private lightThemeClass = 'light-mode';
    private themeKey = 'user-theme'; // LocalStorage key
    private isDarkMode!: boolean;

    constructor(@Inject(PLATFORM_ID) private platformId: any, private windowRef: WindowRefService) {
        this.setInitialTheme();
    }

    /** ✅ Get current dark mode status */
    getIsDarkMode(): boolean {
        return this.isDarkMode;
    }

    /** ✅ Initialize theme based on localStorage or system preference */
    setInitialTheme(): void {
        const win = this.windowRef.nativeWindow;
        if (win) {
            let savedTheme = null;
            if (isPlatformBrowser(this.platformId)) {
                savedTheme = localStorage.getItem(this.themeKey);
            }
            
            if (savedTheme) {
                // Load user preference from localStorage
                this.isDarkMode = savedTheme === this.darkThemeClass;
            } else {
                // If no saved theme, follow system preference
                this.isDarkMode = win.matchMedia('(prefers-color-scheme: dark)').matches;
            }

            this.applyTheme(this.isDarkMode ? this.darkThemeClass : this.lightThemeClass);
        }
    }

    /** ✅ Toggle dark/light mode and persist preference */
    toggleTheme(isDarkMode: boolean): void {
        this.isDarkMode = isDarkMode;
        if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem(this.themeKey, isDarkMode ? this.darkThemeClass : this.lightThemeClass);
        }
        this.applyTheme(isDarkMode ? this.darkThemeClass : this.lightThemeClass);
    }

    /** ✅ Apply the selected theme to the body */
    private applyTheme(themeClass: string): void {
        const body = document.body;
        body.classList.remove(this.darkThemeClass, this.lightThemeClass);
        body.classList.add(themeClass);
    }
}
