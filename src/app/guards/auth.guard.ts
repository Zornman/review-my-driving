import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service'; // Import your AuthService
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean> {
    return this.authService.getUser().pipe(
        tap(user => {
            if (!user) {
                this.router.navigate(['/login']); // ✅ Redirect to login if user logs out
            }
        }),
        map(user => !!user) // Returns true if user exists, false if not
    );
  }
}
