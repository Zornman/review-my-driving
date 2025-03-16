import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';

@Component({
  imports: [ ReactiveFormsModule, CommonModule, MatFormFieldModule, MatInputModule, RouterModule ],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent {
  form!: FormGroup;
  constructor(private fb: FormBuilder, private auth: AuthService, private _snackBar: MatSnackBar) {
    this.form = this.fb.group({
          email: ['', [Validators.required, Validators.email]]
    });
  }

  resetPassword() {
    if (!this.form) return;

    this.auth.sendPasswordResetEmail(this.form.get('email')?.value)
    .then(() => {
      this._snackBar.open('Password reset email sent!', 'Ok', { duration: 3000 });
    })
    .catch((error) => {
      this._snackBar.open('Password reset email sent!', 'Ok', { duration: 3000 });
    })
    .finally(() => {
      this.form.reset();
    });
  }
}
