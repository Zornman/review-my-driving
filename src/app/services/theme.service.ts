import { Injectable } from "@angular/core";
import { WindowRefService } from "./window.service";

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    private darkThemeClass = 'dark-mode';
    private lightThemeClass = 'light-mode';

    constructor(private windowRef: WindowRefService) {
        this.setInitialTheme();
    }

    setInitialTheme(): void {
        const win = this.windowRef.nativeWindow;
        if (win) {
            const prefersDark = win.matchMedia('(prefers-color-scheme: dark)').matches;
            this.applyTheme(prefersDark ? this.darkThemeClass : this.lightThemeClass);
        }
    }

    toggleTheme(isDarkMode: boolean): void {
        this.applyTheme(isDarkMode ? this.darkThemeClass : this.lightThemeClass);
    }

    private applyTheme(themeClass: string): void {
        const body = document.body;
        body.classList.remove(this.darkThemeClass, this.lightThemeClass);
        body.classList.add(themeClass);
    }
}