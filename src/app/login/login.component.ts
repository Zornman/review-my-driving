import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../services/auth.service';
import { Location } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private _snackBar = inject(MatSnackBar);

  form!: FormGroup;
  errorMessage: string | null = null;

  hidePassword = true;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private location: Location,
    private router: Router
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });

    this.authService.getUser().subscribe(user => {
      if (user) this.router.navigate(['/index']);
    });
  }

  async signIn(): Promise<void> {
    if (this.isSubmitting) return;

    this.errorMessage = null;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password } = this.form.value;

    this.isSubmitting = true;
    try {
      await this.authService.signInWithEmail(email, password);
      this.location.back();
      this._snackBar.open('Login successful, welcome back!', 'Ok', { duration: 3000 });
    } catch (error: any) {
      this.errorMessage = this.formatSignInErrorMessage(error?.message ?? '');
    } finally {
      this.isSubmitting = false;
    }
  }

  async signInWithGoogle(): Promise<void> {
    if (this.isSubmitting) return;

    this.errorMessage = null;

    this.isSubmitting = true;
    try {
      await this.authService.googleSignIn();
      this.location.back();
      this._snackBar.open('Login successful, welcome back!', 'Ok', { duration: 3000 });
    } catch (error: any) {
      this.errorMessage = 'Google Sign-In failed. Please try again.';
      console.error(error);
    } finally {
      this.isSubmitting = false;
    }
  }

  private formatSignInErrorMessage(message: string): string {
    if (message.includes('invalid-credential')) return 'Invalid email or password.';
    if (message.includes('user-disabled')) return 'This account has been disabled.';
    if (message.includes('too-many-requests')) return 'Too many attempts. Please try again later.';
    return 'Sign in failed. Please try again.';
  }
}
