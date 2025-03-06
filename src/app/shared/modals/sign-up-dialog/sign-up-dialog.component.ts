import { Component } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sign-up-dialog',
  imports: [
    MatDialogModule
  ],
  templateUrl: './sign-up-dialog.component.html',
  styleUrl: './sign-up-dialog.component.scss'
})
export class SignUpDialogComponent {
  constructor(private dialogRef: MatDialogRef<SignUpDialogComponent>, private router: Router) {}

  signUp(): void {
    // Handle sign-up logic here
    this.router.navigate(['/register']);
    this.dialogRef.close(); // Close the dialog
  }
}
