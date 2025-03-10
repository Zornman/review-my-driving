import { __decorate } from "tslib";
import { Injectable } from '@angular/core';
import { map, tap } from 'rxjs/operators';
let AuthGuard = class AuthGuard {
    authService;
    router;
    constructor(authService, router) {
        this.authService = authService;
        this.router = router;
    }
    canActivate() {
        return this.authService.getUser().pipe(tap(user => {
            if (!user) {
                this.router.navigate(['/login']); // ✅ Redirect to login if user logs out
            }
        }), map(user => !!user) // Returns true if user exists, false if not
        );
    }
};
AuthGuard = __decorate([
    Injectable({
        providedIn: 'root'
    })
], AuthGuard);
export { AuthGuard };
