import { Component, inject, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { CommonModule, Location } from '@angular/common';
import { EmailValidatorDirective } from '../shared/directives/validate-email.directive';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MongoService } from '../services/mongo.service';
import { User } from 'firebase/auth';
import { firstValueFrom } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-register',
  imports: [
    EmailValidatorDirective,
    ReactiveFormsModule,
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    RouterModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnInit {
  private _snackBar = inject(MatSnackBar);

  form!: FormGroup;
  errorMessage: string | null = null;

  hidePassword = true;
  hideConfirmPassword = true;

  uniqueId!: string | null;

  isSubmitting = false;

  constructor(
    private activatedRoute: ActivatedRoute,
    private fb: FormBuilder,
    private authService: AuthService,
    private location: Location,
    private router: Router,
    private dbService: MongoService
  ) {
    this.authService.getUser().subscribe(user => {
      if (user) this.router.navigate(['/account']);
    });
  }

  ngOnInit(): void {
    this.uniqueId = this.activatedRoute.snapshot.paramMap.get('uniqueId');
    this.createForm();
  }

  private createForm(): void {
    this.form = this.fb.group(
      {
        firstName: ['', Validators.required],
        lastName: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', Validators.required],
        uniqueId: [this.uniqueId]
      },
      { validators: this.passwordsMatchValidator }
    );
  }

  private passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordsMismatch: true };
  }

  private async getCurrentUserOrThrow(): Promise<User> {
    return await firstValueFrom(
      this.authService.getUser().pipe(
        filter((u): u is User => !!u),
        take(1)
      )
    );
  }

  private async claimUniqueIdIfPresent(uniqueId: string | null): Promise<void> {
    if (!uniqueId) return;

    const user = await this.getCurrentUserOrThrow();
    const data = {
      uniqueId,
      userId: user.uid,
      status: 'claimed'
    };

    await firstValueFrom(this.dbService.updateSampleMapper(data));
  }

  // Handle Google Sign-Up
  async signUpWithGoogle(): Promise<void> {
    if (this.isSubmitting) return;

    this.errorMessage = null;
    this.isSubmitting = true;

    try {
      await this.authService.googleSignIn();
      await this.claimUniqueIdIfPresent(this.uniqueId);

      this._snackBar.open('Sign up successful!', 'Ok', { duration: 3000 });
      this.location.back();
    } catch (error: any) {
      this.errorMessage = 'Google Sign-In failed. Please try again.';
      console.error(error);
    } finally {
      this.isSubmitting = false;
    }
  }

  // Handle Email/Password Sign-Up
  async signUpWithEmail(): Promise<void> {
    if (this.isSubmitting) return;

    this.errorMessage = null;

    if (!this.validateEmail(this.form.get('email')!)) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    const { firstName, lastName, email, password, uniqueId } = this.form.value;

    try {
      await this.authService.signUpWithEmail(email, password, `${firstName} ${lastName}`);
      await this.claimUniqueIdIfPresent(uniqueId);

      this._snackBar.open('Sign up successful!', 'Ok', { duration: 3000 });
      this.location.back();
    } catch (error: any) {
      console.error(error);
      this.errorMessage = this.mapSignUpErrorMessages(error?.message ?? 'Sign up failed.');
    } finally {
      this.isSubmitting = false;
    }
  }

  validateEmail(control: AbstractControl): ValidationErrors | null {
    const email = control.value;
    let valid = EmailValidatorDirective.prototype.validate(control);
    if (!valid) {
      return null; // Allow empty values (use `required` for mandatory validation)
    }
    return email;
  }

  mapSignUpErrorMessages(message: string): string {
    if (message.includes('email-already-in-use')) {
      return 'E-mail already exists, try logging in.';
    }
    return message;
  }
}
