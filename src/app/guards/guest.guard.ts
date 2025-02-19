import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable } from 'rxjs';
import { map, tap, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class GuestGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean> {
    return this.authService.getUser().pipe(
      take(1), // Ensures we only check once
      tap(user => console.log("GuestGuard: Detected user:", user)), // Debugging
      map(user => {
        if (user) {
          console.log("GuestGuard: Redirecting to /account");
          this.router.navigate(['/account']);
          return false; // Block access if logged in
        }
        console.log("GuestGuard: Allowing access to login/signup");
        return true; // Allow access if not logged in
      })
    );
  }
}
