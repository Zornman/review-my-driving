import { __decorate } from "tslib";
import { Injectable } from '@angular/core';
import { map, tap, take } from 'rxjs/operators';
let GuestGuard = class GuestGuard {
    authService;
    router;
    constructor(authService, router) {
        this.authService = authService;
        this.router = router;
    }
    canActivate() {
        return this.authService.getUser().pipe(take(1), // Ensures we only check once
        tap(user => console.log("GuestGuard: Detected user:", user)), // Debugging
        map(user => {
            if (user) {
                console.log("GuestGuard: Redirecting to /account");
                this.router.navigate(['/account']);
                return false; // Block access if logged in
            }
            console.log("GuestGuard: Allowing access to login/signup");
            return true; // Allow access if not logged in
        }));
    }
};
GuestGuard = __decorate([
    Injectable({
        providedIn: 'root'
    })
], GuestGuard);
export { GuestGuard };
