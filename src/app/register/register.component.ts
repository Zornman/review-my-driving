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

@Component({
  selector: 'app-register',
  imports: [ 
    EmailValidatorDirective,
    ReactiveFormsModule, // Add this
    CommonModule,
    FormsModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatIconModule, 
    RouterModule 
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

  constructor(
    private activatedRoute: ActivatedRoute,
    private fb: FormBuilder,
    private authService: AuthService,
    private location: Location,
    private router: Router,
    private dbService: MongoService
  ) {
    this.authService.getUser().subscribe(user => {
      if (user) {
        this.router.navigate(['/account']);
      }
    });
  }

  ngOnInit(): void {
    this.uniqueId = this.activatedRoute.snapshot.paramMap.get('uniqueId');
    this.createForm();
  }

  // Initialize the form group with validators
  private createForm(): void {
    this.form = this.fb.group(
      {
        firstName: ['', Validators.required],
        lastName: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]], // Use Angular's email validator
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', Validators.required],
        uniqueId: [this.uniqueId] // Add uniqueId to the form
      },
      { validators: this.passwordsMatchValidator }
    );

    // Subscribe to form status changes to set the error message
    this.form.statusChanges.subscribe(() => {
      this.setErrorMessage();
    });
  }

  // Validator to check if passwords match
  private passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordsMismatch: true };
  }

  private setErrorMessage(): void {
    if (this.form.get('firstName')?.hasError('required')) {
      this.errorMessage = 'First name is required.';
    } else if (this.form.get('lastName')?.hasError('required')) {
      this.errorMessage = 'Last name is required.';
    } else if (this.form.get('email')?.hasError('required')) {
      this.errorMessage = 'Email is required.';
    } else if (this.form.get('email')?.hasError('email')) {
      this.errorMessage = 'Please enter a valid email address.';
    } else if (this.form.get('password')?.hasError('required')) {
      this.errorMessage = 'Password is required.';
    } else if (this.form.get('password')?.hasError('minlength')) {
      this.errorMessage = 'Password must be at least 8 characters long.';
    } else if (this.form.errors?.['passwordsMismatch']) {
      this.errorMessage = 'Passwords do not match.';
    } else {
      this.errorMessage = '';
    }
  }

  // Handle Google Sign-Up
  signUpWithGoogle(): void {
    this.authService.googleSignIn()
      .then(() => {
        this.location.back();
        this._snackBar.open('Sign up successful!', 'Ok', { duration: 3000 });
      })
      .catch((error) => {
        this.errorMessage = 'Google Sign-In failed: ' + error.message;
      });
  }

  // Handle Email/Password Sign-Up
  signUpWithEmail(): void {
    if (this.form.invalid) {
      this.errorMessage = 'Please fill out the form correctly.';
      return;
    }

    const { firstName, lastName, email, password, uniqueId } = this.form.value;

    this.authService.signUpWithEmail(email, password, `${firstName} ${lastName}`)
      .then(() => {
        if (uniqueId) {
          let userData = null as User | null;;
          this.authService.getUser().subscribe(user => {
            if (user) {
              userData = user; // Assign the current user to the variable
            }
          }); // Get the current user's ID
          const data = {
            uniqueId: uniqueId,
            userId: userData?.uid, // Use the current user's ID
            status: 'claimed',
          };
          // If uniqueId is provided, save it to the database
          this.dbService.updateSampleMapper(data).subscribe({
            next: () => console.log('Unique ID saved successfully'),
            error: (error) => console.error('Error saving unique ID:', error)
          });
        }

        this.location.back();
        this.errorMessage = null;
        this._snackBar.open('Sign up successful!', 'Ok', { duration: 3000 });
      })
      .catch((error) => {
        console.error(error);
        this.errorMessage = this.mapSignUpErrorMessages(error.message);
      });
  }

  mapSignUpErrorMessages(message: string): string {
    if (message.includes('email-already-in-use')) {
      return 'E-mail already exists, try logging in.';
    } else {
      return message;
    }
  }
}
